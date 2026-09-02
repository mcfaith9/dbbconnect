import type { User, Folder, Document, DocumentComment, ActivityLog } from '@/types'

const DB_NAME = 'dbb_fieldhub_indexeddb'
const DB_VERSION = 2

const STORES = {
  USERS: 'users',
  FOLDERS: 'folders',
  DOCUMENTS: 'documents',
  COMMENTS: 'comments',
  ACTIVITIES: 'activities',
  SYNC_QUEUE: 'sync_queue',
} as const

// Test / official accounts for Quick Login
export const INITIAL_USERS: User[] = [
  {
    id: 'admin-001',
    username: 'dmbbadmin',
    displayName: 'DMBB Administrator',
    name: 'DMBB Administrator',
    email: 'dmbbadmin@dbb.com',
    role: 'admin',
    position: 'Office Document Administrator',
    department: 'Executive Management & Operations',
    phone: '+63 917 111 2233',
  },
  {
    id: 'admin-002',
    username: 'dbbadmin',
    displayName: 'DBB Administrator',
    name: 'DBB Administrator',
    email: 'dbbadmin@dbb.com',
    role: 'admin',
    position: 'Head Field Administrator',
    department: 'Field Management & Operations',
    phone: '+63 917 222 3344',
  },
  {
    id: 'employee-001',
    username: 'Marc Louie Cabigas',
    displayName: 'Marc Louie Cabigas',
    name: 'Marc Louie Cabigas',
    email: 'marc.cabigas@dbb.com',
    role: 'employee',
    position: 'Lead Field Engineer',
    department: 'Naga Project Team',
    phone: '+63 918 100 2001',
    assignedProject: 'Naga Project Phase 2',
  },
  {
    id: 'employee-002',
    username: 'Juan Dela Cruz',
    displayName: 'Juan Dela Cruz',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@dbb.com',
    role: 'employee',
    position: 'Senior Field Engineer',
    department: 'Naga Project Team',
    phone: '+63 918 234 5678',
    assignedProject: 'Naga Project Phase 2',
  },
  {
    id: 'employee-003',
    username: 'Pedro Santos',
    displayName: 'Pedro Santos',
    name: 'Pedro Santos',
    email: 'pedro.santos@dbb.com',
    role: 'employee',
    position: 'Site Safety Officer',
    department: 'Cebu Commercial Port',
    phone: '+63 920 345 6789',
    assignedProject: 'Cebu Project',
  },
]

export const INITIAL_FOLDERS: Folder[] = []
export const INITIAL_DOCUMENTS: Document[] = []
export const INITIAL_COMMENTS: DocumentComment[] = []
export const INITIAL_ACTIVITIES: ActivityLog[] = []

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
        db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
        db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
        db.createObjectStore(STORES.COMMENTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
        db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const storage = {
  async init(): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(
      [STORES.USERS, STORES.FOLDERS, STORES.DOCUMENTS, STORES.COMMENTS, STORES.ACTIVITIES],
      'readwrite',
    )

    // Seed Users if empty or ensure users are synchronized
    const userStore = tx.objectStore(STORES.USERS)
    const countReq = userStore.count()
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        INITIAL_USERS.forEach((u) => userStore.put(u))
      }
    }

    // Clean up any legacy dummy documents or folders if they exist from version 1
    const docStore = tx.objectStore(STORES.DOCUMENTS)
    const docGetAllReq = docStore.getAll()
    docGetAllReq.onsuccess = () => {
      const docs = docGetAllReq.result as Document[]
      docs.forEach((doc) => {
        if (
          doc.id.startsWith('doc-marc-') ||
          doc.id.startsWith('doc-juan-') ||
          doc.id.startsWith('doc-pedro-') ||
          doc.id.startsWith('doc-shared-')
        ) {
          docStore.delete(doc.id)
        }
      })
    }

    const folderStore = tx.objectStore(STORES.FOLDERS)
    const folderGetAllReq = folderStore.getAll()
    folderGetAllReq.onsuccess = () => {
      const folders = folderGetAllReq.result as Folder[]
      folders.forEach((folder) => {
        if (
          folder.id.startsWith('folder-marc-') ||
          folder.id.startsWith('folder-juan-') ||
          folder.id.startsWith('folder-pedro-') ||
          folder.id.startsWith('folder-shared-')
        ) {
          folderStore.delete(folder.id)
        }
      })
    }

    const commentStore = tx.objectStore(STORES.COMMENTS)
    const commentGetAllReq = commentStore.getAll()
    commentGetAllReq.onsuccess = () => {
      const comments = commentGetAllReq.result as DocumentComment[]
      comments.forEach((c) => {
        if (c.id.startsWith('com-1') || c.id.startsWith('com-2') || c.id.startsWith('com-3')) {
          commentStore.delete(c.id)
        }
      })
    }

    const actStore = tx.objectStore(STORES.ACTIVITIES)
    const actGetAllReq = actStore.getAll()
    actGetAllReq.onsuccess = () => {
      const acts = actGetAllReq.result as ActivityLog[]
      acts.forEach((a) => {
        if (a.id.startsWith('act-1') || a.id.startsWith('act-2') || a.id.startsWith('act-3') || a.id.startsWith('act-4')) {
          actStore.delete(a.id)
        }
      })
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  },

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  },

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.get(id)
      request.onsuccess = () => resolve((request.result as T) || null)
      request.onerror = () => reject(request.error)
    })
  },

  async put<T>(storeName: string, item: T): Promise<T> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.put(item)
      request.onsuccess = () => resolve(item)
      request.onerror = () => reject(request.error)
    })
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  async clearStore(storeName: string): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  STORES,
}
