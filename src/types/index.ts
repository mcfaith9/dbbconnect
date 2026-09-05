import type { Component } from 'vue'

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  name: string
  displayName?: string
  username?: string
  email: string
  role: UserRole
  avatar?: string
  position: string
  department: string
  phone?: string
  assignedProject?: string
  status?: 'active' | 'inactive' | 'pending'
}

export interface NavbarItem {
  label: string
  value?: string
  url?: string
  icon?: Component
  action?: () => void
  adminOnly?: boolean
  destructive?: boolean
  separatorBefore?: boolean
  disabled?: boolean
}

export interface AuthUser {
  id: string
  username: string
  displayName: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  position: string
  department: string
  phone?: string
  assignedProject?: string
  status?: 'active' | 'inactive' | 'pending'
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null // null for root of user/shared
  ownerId: string // employee user ID, or 'shared' for company shared documents
  createdAt: string
  updatedAt: string
  color?: string
  isSystem?: boolean
  status?: 'active' | 'pending' | 'completed' | 'archived'
}

export type DocumentType = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'other'

export interface Document {
  id: string
  name: string
  originalName: string
  mimeType: string
  type: DocumentType
  size: number // in bytes
  sizeFormatted: string
  folderId: string | null // folder id or null for root
  ownerId: string // employee user ID, or 'shared'
  uploadedBy: {
    id: string
    name: string
    role: UserRole
  }
  createdAt: string
  updatedAt: string
  version: string
  isShared?: boolean
  assignedTo: string[] // List of employee user IDs who have access
  tags?: string[]
  offlineCached: boolean
  offlineCachedAt?: string
  previewUrl?: string
  thumbnailUrl?: string
  textContent?: string
  docxHtml?: string
  dataUrl?: string
  fileData?: string
  pageCount?: number
  downloadUrl?: string
}

export interface DocumentComment {
  id: string
  documentId: string
  authorId: string
  authorName: string
  authorRole: UserRole
  authorAvatar?: string
  content: string
  createdAt: string
  isOfflinePending?: boolean
}

export interface ActivityLog {
  id: string
  type: 'upload' | 'folder_create' | 'create_folder' | 'assign' | 'comment' | 'offline_sync' | 'delete' | 'move'
  userId: string
  userName: string
  userRole: UserRole
  actionTitle: string
  description: string
  targetName: string
  targetId?: string
  employeeName?: string
  timestamp: string
}

export interface SyncQueueItem {
  id: string
  type: 'comment' | 'offline_cache_add' | 'offline_cache_remove' | 'upload_file'
  payload: any
  createdAt: string
  retryCount: number
}

export interface SyncStatusState {
  isOnline: boolean
  isSimulatedOffline: boolean
  isSyncing: boolean
  lastSyncedAt: string | null
  pendingQueueCount: number
}

export interface BreadcrumbCrumb {
  id: string | null
  label: string
  path: string
}
