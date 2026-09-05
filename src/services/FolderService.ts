import { storage } from './storage'
import { api } from './api'
import type { Folder, BreadcrumbCrumb } from '@/types'

export const FolderService = {
  async getAllFolders(): Promise<Folder[]> {
    try {
      const res = await api.get<Folder[]>('/folders')
      if (res.success && Array.isArray(res.data)) {
        for (const f of res.data) {
          await storage.put<Folder>(storage.STORES.FOLDERS, f)
        }
        return res.data
      }
    } catch (e) {
      console.warn('Failed to fetch folders from API, checking local cache:', e)
    }
    return await storage.getAll<Folder>(storage.STORES.FOLDERS)
  },

  async getFoldersByOwner(ownerId: string): Promise<Folder[]> {
    try {
      const res = await api.get<Folder[]>('/folders', { owner_id: ownerId })
      if (res.success && Array.isArray(res.data)) {
        for (const f of res.data) {
          await storage.put<Folder>(storage.STORES.FOLDERS, f)
        }
        return res.data
      }
    } catch (e) {
      console.warn('Failed to fetch folders by owner from API:', e)
    }
    const all = await storage.getAll<Folder>(storage.STORES.FOLDERS)
    return all.filter((f) => f.ownerId === ownerId)
  },

  async getChildFolders(parentId: string | null, ownerId: string): Promise<Folder[]> {
    try {
      const params: Record<string, string> = { owner_id: ownerId }
      if (parentId) {
        params.parent_id = parentId
      } else {
        params.parent_id = 'root'
      }
      const res = await api.get<Folder[]>('/folders', params)
      if (res.success && Array.isArray(res.data)) {
        for (const f of res.data) {
          await storage.put<Folder>(storage.STORES.FOLDERS, f)
        }
        return res.data
      }
    } catch (e) {
      console.warn('Failed to fetch child folders from API:', e)
    }
    const folders = await this.getFoldersByOwner(ownerId)
    return folders.filter((f) => (parentId ? f.parentId === parentId : f.parentId === null))
  },

  async getFolderById(id: string): Promise<Folder | null> {
    try {
      const res = await api.get<Folder>(`/folders/${id}`)
      if (res.success && res.data) {
        await storage.put<Folder>(storage.STORES.FOLDERS, res.data)
        return res.data
      }
    } catch (e) {
      console.warn('Failed to fetch folder by id from API:', e)
    }
    return await storage.getById<Folder>(storage.STORES.FOLDERS, id)
  },

  async createFolder(params: {
    name: string
    parentId: string | null
    ownerId: string
    color?: string
  }): Promise<Folder> {
    const res = await api.post<Folder>('/folders', {
      name: params.name.trim(),
      parentId: params.parentId,
      ownerId: params.ownerId,
      color: params.color || '#2563eb',
    })

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to create folder on Laravel server.')
    }

    const createdFolder: Folder = res.data
    await storage.put<Folder>(storage.STORES.FOLDERS, createdFolder)
    return createdFolder
  },

  async renameFolder(id: string, newName: string): Promise<Folder | null> {
    const res = await api.put<Folder>(`/folders/${id}`, { name: newName.trim() })
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to rename folder on Laravel server.')
    }
    await storage.put<Folder>(storage.STORES.FOLDERS, res.data)
    return res.data
  },

  async moveFolder(id: string, targetParentId: string | null): Promise<Folder | null> {
    const res = await api.put<Folder>(`/folders/${id}`, { parentId: targetParentId })
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to move folder on Laravel server.')
    }
    await storage.put<Folder>(storage.STORES.FOLDERS, res.data)
    return res.data
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await api.delete(`/folders/${id}`)
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete folder on Laravel server.')
    }
    await storage.delete(storage.STORES.FOLDERS, id)
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
