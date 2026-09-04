import { storage } from './storage'
import { api } from './api'
import type { Document, DocumentType, UserRole } from '@/types'

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function detectDocumentType(fileName: string, mimeType?: string): DocumentType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType?.startsWith('image/')) return 'image'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint'
  return 'other'
}

export const DocumentService = {
  async getAllDocuments(): Promise<Document[]> {
    // Attempt remote sync if Laravel API is available
    try {
      const isOnline = await api.checkHealth()
      if (isOnline) {
        const res = await api.get<Document[]>('/documents')
        if (res.success && Array.isArray(res.data)) {
          for (const doc of res.data) {
            await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
          }
        }
      }
    } catch (e) {
      console.warn('API sync failed, continuing with local cache', e)
    }
    return await storage.getAll<Document>(storage.STORES.DOCUMENTS)
  },

  async getDocumentsByOwner(ownerId: string): Promise<Document[]> {
    const all = await this.getAllDocuments()
    return all.filter((d) => d.ownerId === ownerId)
  },

  async getDocumentsByFolder(folderId: string | null, ownerId: string): Promise<Document[]> {
    const docs = await this.getDocumentsByOwner(ownerId)
    return docs.filter((d) => (folderId ? d.folderId === folderId : d.folderId === null))
  },

  async getAssignedDocumentsForEmployee(employeeId: string): Promise<Document[]> {
    const all = await this.getAllDocuments()
    return all.filter((d) => {
      // Owned by employee OR explicitly assigned to employee OR company shared
      return d.ownerId === employeeId || d.assignedTo?.includes(employeeId) || d.isShared || d.ownerId === 'shared'
    })
  },

  async getDocumentById(id: string): Promise<Document | null> {
    return await storage.getById<Document>(storage.STORES.DOCUMENTS, id)
  },

  async uploadDocument(params: {
    name: string
    originalName?: string
    file?: File
    mimeType?: string
    size?: number
    folderId: string | null
    ownerId: string // employee id or 'shared'
    uploadedBy: { id: string; name: string; role: UserRole }
    assignedTo?: string[]
    previewUrl?: string
    thumbnailUrl?: string
    textContent?: string
    docxHtml?: string
    dataUrl?: string
    pageCount?: number
    tags?: string[]
  }): Promise<Document> {
    const fileName = params.name.trim()
    const docType = detectDocumentType(fileName, params.mimeType || params.file?.type)
    const size = params.size || params.file?.size || 0
    
    // Auto-assign: if uploaded to an employee, automatically include that employee in assignedTo
    const assigned = new Set<string>(params.assignedTo || [])
    if (params.ownerId !== 'shared') {
      assigned.add(params.ownerId)
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: fileName,
      originalName: params.originalName || fileName,
      mimeType: params.mimeType || params.file?.type || (docType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
      type: docType,
      size,
      sizeFormatted: formatBytes(size),
      folderId: params.folderId,
      ownerId: params.ownerId,
      uploadedBy: params.uploadedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 'v1.0',
      isShared: params.ownerId === 'shared',
      assignedTo: Array.from(assigned),
      tags: params.tags || (docType === 'image' ? ['Site Photo'] : ['Field Document']),
      offlineCached: true, // uploaded files are cached locally in IndexedDB
      offlineCachedAt: new Date().toISOString(),
      previewUrl: params.previewUrl,
      thumbnailUrl: params.thumbnailUrl || (docType === 'image' ? params.dataUrl : undefined),
      textContent: params.textContent,
      docxHtml: params.docxHtml,
      dataUrl: params.dataUrl,
      pageCount: params.pageCount,
    }

    const savedDoc = await storage.put<Document>(storage.STORES.DOCUMENTS, newDoc)

    // Sync to Laravel API if connected
    try {
      const isOnline = await api.checkHealth()
      if (isOnline) {
        if (params.file) {
          const formData = new FormData()
          formData.append('file', params.file)
          formData.append('name', fileName)
          formData.append('originalName', params.originalName || fileName)
          formData.append('ownerId', params.ownerId)
          if (params.folderId) formData.append('folderId', params.folderId)
          if (params.previewUrl) formData.append('previewUrl', params.previewUrl)
          if (params.thumbnailUrl) formData.append('thumbnailUrl', params.thumbnailUrl)
          if (params.textContent) formData.append('textContent', params.textContent)
          if (params.tags) {
            params.tags.forEach((t, i) => formData.append(`tags[${i}]`, t))
          }
          if (params.assignedTo) {
            params.assignedTo.forEach((uid, i) => formData.append(`assignedTo[${i}]`, uid))
          }
          api.post('/documents', formData).catch(() => {})
        } else {
          api.post('/documents', {
            name: fileName,
            originalName: params.originalName || fileName,
            mimeType: newDoc.mimeType,
            size: newDoc.size,
            folderId: params.folderId,
            ownerId: params.ownerId,
            tags: newDoc.tags,
            previewUrl: params.previewUrl,
            thumbnailUrl: params.thumbnailUrl,
            textContent: params.textContent,
            assignedTo: Array.from(assigned),
          }).catch(() => {})
        }
      }
    } catch {
      // Keep local copy safely
    }

    return savedDoc
  },

  async renameDocument(id: string, newName: string): Promise<Document | null> {
    const doc = await this.getDocumentById(id)
    if (!doc) return null
    doc.name = newName.trim()
    doc.updatedAt = new Date().toISOString()
    const saved = await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
    api.put(`/documents/${id}`, { name: doc.name }).catch(() => {})
    return saved
  },

  async moveDocument(id: string, targetFolderId: string | null): Promise<Document | null> {
    const doc = await this.getDocumentById(id)
    if (!doc) return null
    doc.folderId = targetFolderId
    doc.updatedAt = new Date().toISOString()
    const saved = await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
    api.put(`/documents/${id}`, { folderId: targetFolderId }).catch(() => {})
    return saved
  },

  async deleteDocument(id: string): Promise<void> {
    await storage.delete(storage.STORES.DOCUMENTS, id)
    api.delete(`/documents/${id}`).catch(() => {})
  },

  async toggleOfflineCache(id: string, shouldCache: boolean): Promise<Document | null> {
    const doc = await this.getDocumentById(id)
    if (!doc) return null
    doc.offlineCached = shouldCache
    doc.offlineCachedAt = shouldCache ? new Date().toISOString() : undefined
    return await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
  },

  async getOfflineCachedDocuments(employeeId?: string): Promise<Document[]> {
    const all = await this.getAllDocuments()
    return all.filter((d) => {
      const isCached = d.offlineCached === true
      if (!employeeId) return isCached
      return isCached && (d.ownerId === employeeId || d.assignedTo?.includes(employeeId) || d.isShared)
    })
  },

  async searchDocuments(query: string, ownerId?: string): Promise<Document[]> {
    const cleanQ = query.toLowerCase().trim()
    if (!cleanQ) return []
    const all = await this.getAllDocuments()
    return all.filter((d) => {
      if (ownerId && d.ownerId !== ownerId && !d.assignedTo?.includes(ownerId) && !d.isShared) {
        return false
      }
      return (
        d.name.toLowerCase().includes(cleanQ) ||
        d.originalName.toLowerCase().includes(cleanQ) ||
        d.tags?.some((t) => t.toLowerCase().includes(cleanQ)) ||
        d.textContent?.toLowerCase().includes(cleanQ)
      )
    })
  },
}
