import { storage } from './storage'
import { api } from './api'
import type { Document, DocumentType, UserRole } from '@/types'

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
    try {
      const res = await api.get<Document[]>('/documents')
      if (res.success && Array.isArray(res.data)) {
        for (const doc of res.data) {
          await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed, continuing with local cache:', e)
    }
    return await storage.getAll<Document>(storage.STORES.DOCUMENTS)
  },

  async getDocumentsByOwner(ownerId: string): Promise<Document[]> {
    try {
      const res = await api.get<Document[]>('/documents', { owner_id: ownerId })
      if (res.success && Array.isArray(res.data)) {
        for (const doc of res.data) {
          await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for owner documents:', e)
    }
    const all = await storage.getAll<Document>(storage.STORES.DOCUMENTS)
    return all.filter((d) => d.ownerId === ownerId)
  },

  async getDocumentsByFolder(folderId: string | null, ownerId: string): Promise<Document[]> {
    try {
      const params: Record<string, string> = { owner_id: ownerId }
      if (folderId) {
        params.folder_id = folderId
      } else {
        params.folder_id = 'root'
      }
      const res = await api.get<Document[]>('/documents', params)
      if (res.success && Array.isArray(res.data)) {
        for (const doc of res.data) {
          await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for folder documents:', e)
    }
    const docs = await this.getDocumentsByOwner(ownerId)
    return docs.filter((d) => (folderId ? d.folderId === folderId : d.folderId === null))
  },

  async getAssignedDocumentsForEmployee(employeeId: string): Promise<Document[]> {
    try {
      const res = await api.get<Document[]>('/documents', { employee_id: employeeId })
      if (res.success && Array.isArray(res.data)) {
        for (const doc of res.data) {
          await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for assigned documents:', e)
    }
    const all = await this.getAllDocuments()
    return all.filter((d) => {
      return d.ownerId === employeeId || d.assignedTo?.includes(employeeId) || d.isShared || d.ownerId === 'shared'
    })
  },

  async getDocumentById(id: string): Promise<Document | null> {
    try {
      const res = await api.get<Document>(`/documents/${id}`)
      if (res.success && res.data) {
        await storage.put<Document>(storage.STORES.DOCUMENTS, res.data)
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for single document:', e)
    }
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

    let res: any
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
      if (params.dataUrl) formData.append('dataUrl', params.dataUrl)
      if (params.docxHtml) formData.append('docxHtml', params.docxHtml)
      if (params.pageCount) formData.append('pageCount', String(params.pageCount))
      if (params.tags) {
        params.tags.forEach((t, i) => formData.append(`tags[${i}]`, t))
      }
      Array.from(assigned).forEach((uid, i) => formData.append(`assignedTo[${i}]`, uid))
      res = await api.post<Document>('/documents', formData)
    } else {
      res = await api.post<Document>('/documents', {
        name: fileName,
        originalName: params.originalName || fileName,
        mimeType: params.mimeType || (docType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
        size,
        folderId: params.folderId,
        ownerId: params.ownerId,
        tags: params.tags || (docType === 'image' ? ['Site Photo'] : ['Field Document']),
        previewUrl: params.previewUrl,
        thumbnailUrl: params.thumbnailUrl,
        textContent: params.textContent,
        docxHtml: params.docxHtml,
        dataUrl: params.dataUrl,
        pageCount: params.pageCount,
        assignedTo: Array.from(assigned),
      })
    }

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to upload document to Laravel server.')
    }

    const savedDoc: Document = res.data
    await storage.put<Document>(storage.STORES.DOCUMENTS, savedDoc)
    return savedDoc
  },

  async renameDocument(id: string, newName: string): Promise<Document | null> {
    const res = await api.put<Document>(`/documents/${id}`, { name: newName.trim() })
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to rename document on Laravel server.')
    }
    await storage.put<Document>(storage.STORES.DOCUMENTS, res.data)
    return res.data
  },

  async moveDocument(id: string, targetFolderId: string | null): Promise<Document | null> {
    const res = await api.put<Document>(`/documents/${id}`, { folderId: targetFolderId })
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to move document on Laravel server.')
    }
    await storage.put<Document>(storage.STORES.DOCUMENTS, res.data)
    return res.data
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await api.delete(`/documents/${id}`)
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete document on Laravel server.')
    }
    await storage.delete(storage.STORES.DOCUMENTS, id)
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
