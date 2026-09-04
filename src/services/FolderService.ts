import { storage } from './storage'
import { api } from './api'
import type { Folder, BreadcrumbCrumb } from '@/types'

export const FolderService = {
  async getAllFolders(): Promise<Folder[]> {
    // Attempt remote sync if API is available
    try {
      const isOnline = await api.checkHealth()
      if (isOnline) {
        const res = await api.get<Folder[]>('/folders')
        if (res.success && Array.isArray(res.data)) {
          for (const f of res.data) {
            await storage.put<Folder>(storage.STORES.FOLDERS, f)
          }
        }
      }
    } catch {
      // Local fallback
    }
    return await storage.getAll<Folder>(storage.STORES.FOLDERS)
  },

  async getFoldersByOwner(ownerId: string): Promise<Folder[]> {
    const all = await this.getAllFolders()
    return all.filter((f) => f.ownerId === ownerId)
  },

  async getChildFolders(parentId: string | null, ownerId: string): Promise<Folder[]> {
    const folders = await this.getFoldersByOwner(ownerId)
    return folders.filter((f) => (parentId ? f.parentId === parentId : f.parentId === null))
  },

  async getFolderById(id: string): Promise<Folder | null> {
    return await storage.getById<Folder>(storage.STORES.FOLDERS, id)
  },

  async createFolder(params: {
    name: string
    parentId: string | null
    ownerId: string
    color?: string
  }): Promise<Folder> {
    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim(),
      parentId: params.parentId,
      ownerId: params.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: params.color || '#2563eb',
    }

    const saved = await storage.put<Folder>(storage.STORES.FOLDERS, newFolder)
    api.post('/folders', {
      name: newFolder.name,
      parentId: newFolder.parentId,
      ownerId: newFolder.ownerId,
      color: newFolder.color,
    }).catch(() => {})
    return saved
  },

  async renameFolder(id: string, newName: string): Promise<Folder | null> {
    const folder = await this.getFolderById(id)
    if (!folder) return null
    folder.name = newName.trim()
    folder.updatedAt = new Date().toISOString()
    const saved = await storage.put<Folder>(storage.STORES.FOLDERS, folder)
    api.put(`/folders/${id}`, { name: folder.name }).catch(() => {})
    return saved
  },

  async moveFolder(id: string, targetParentId: string | null): Promise<Folder | null> {
    const folder = await this.getFolderById(id)
    if (!folder) return null
    // Prevent moving folder inside itself
    if (id === targetParentId) return null
    folder.parentId = targetParentId
    folder.updatedAt = new Date().toISOString()
    const saved = await storage.put<Folder>(storage.STORES.FOLDERS, folder)
    api.put(`/folders/${id}`, { parentId: targetParentId }).catch(() => {})
    return saved
  },

  async deleteFolder(id: string): Promise<void> {
    const allFolders = await this.getAllFolders()
    const folderIdsToDelete = new Set<string>([id])

    // Find all descendant folders recursively
    let foundNew = true
    while (foundNew) {
      foundNew = false
      for (const f of allFolders) {
        if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id)
          foundNew = true
        }
      }
    }

    // Delete folders
    for (const folderId of folderIdsToDelete) {
      await storage.delete(storage.STORES.FOLDERS, folderId)
    }
    api.delete(`/folders/${id}`).catch(() => {})
  },

  async getFolderPath(folderId: string | null, ownerId: string, basePath = '/field-manager'): Promise<BreadcrumbCrumb[]> {
    if (!folderId) return []

    const crumbs: BreadcrumbCrumb[] = []
    let currentId: string | null = folderId

    const allFolders = await this.getFoldersByOwner(ownerId)
    const folderMap = new Map<string, Folder>(allFolders.map((f) => [f.id, f]))

    while (currentId && folderMap.has(currentId)) {
      const currentFolderItem: Folder = folderMap.get(currentId)!
      crumbs.unshift({
        id: currentFolderItem.id,
        label: currentFolderItem.name,
        path: `${basePath}/${ownerId}/${currentFolderItem.id}`,
      })
      currentId = currentFolderItem.parentId
    }

    return crumbs
  },
}
