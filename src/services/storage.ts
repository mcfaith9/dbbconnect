import type { User, Folder, Document, DocumentComment, ActivityLog } from '@/types'

const DB_NAME = 'dbb_fieldhub_indexeddb'
const DB_VERSION = 1

const STORES = {
  USERS: 'users',
  FOLDERS: 'folders',
  DOCUMENTS: 'documents',
  COMMENTS: 'comments',
  ACTIVITIES: 'activities',
  SYNC_QUEUE: 'sync_queue',
} as const

// Initial seed data
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Maria Clara',
    email: 'admin@dbbconnect.com',
    role: 'admin',
    position: 'Office Document Administrator',
    department: 'Operations & Engineering',
    phone: '+63 917 123 4567',
  },
  {
    id: 'emp-juan',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@dbbconnect.com',
    role: 'employee',
    position: 'Senior Field Engineer',
    department: 'Naga Project Team',
    phone: '+63 918 234 5678',
    assignedProject: 'Naga Project Phase 2',
  },
  {
    id: 'emp-pedro',
    name: 'Pedro Santos',
    email: 'pedro.santos@dbbconnect.com',
    role: 'employee',
    position: 'Site Safety Officer',
    department: 'Cebu Commercial Port',
    phone: '+63 920 345 6789',
    assignedProject: 'Cebu Project',
  },
  {
    id: 'emp-mark',
    name: 'Mark Reyes',
    email: 'mark.reyes@dbbconnect.com',
    role: 'employee',
    position: 'Structural & Quality Inspector',
    department: 'Field Quality Assurance',
    phone: '+63 922 456 7890',
    assignedProject: 'Naga Project Phase 2',
  },
]

export const INITIAL_FOLDERS: Folder[] = [
  // Juan Dela Cruz Folders
  {
    id: 'folder-juan-naga',
    name: 'Naga Project',
    parentId: null,
    ownerId: 'emp-juan',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z',
    color: '#2563eb',
  },
  {
    id: 'folder-juan-safety',
    name: 'Safety',
    parentId: 'folder-juan-naga',
    ownerId: 'emp-juan',
    createdAt: '2026-08-20T08:30:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-juan-drawings',
    name: 'Drawings',
    parentId: 'folder-juan-naga',
    ownerId: 'emp-juan',
    createdAt: '2026-08-20T08:35:00.000Z',
    updatedAt: '2026-08-27T14:20:00.000Z',
    color: '#ea580c',
  },
  {
    id: 'folder-juan-permits',
    name: 'Permits',
    parentId: 'folder-juan-naga',
    ownerId: 'emp-juan',
    createdAt: '2026-08-20T08:40:00.000Z',
    updatedAt: '2026-08-30T11:45:00.000Z',
    color: '#9333ea',
  },
  {
    id: 'folder-juan-photos',
    name: 'Photos',
    parentId: 'folder-juan-naga',
    ownerId: 'emp-juan',
    createdAt: '2026-08-21T09:00:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    color: '#0891b2',
  },

  // Pedro Santos Folders
  {
    id: 'folder-pedro-cebu',
    name: 'Cebu Project',
    parentId: null,
    ownerId: 'emp-pedro',
    createdAt: '2026-08-22T08:00:00.000Z',
    updatedAt: '2026-08-29T15:30:00.000Z',
    color: '#059669',
  },
  {
    id: 'folder-pedro-safety',
    name: 'Safety',
    parentId: 'folder-pedro-cebu',
    ownerId: 'emp-pedro',
    createdAt: '2026-08-22T08:15:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-pedro-photos',
    name: 'Photos',
    parentId: 'folder-pedro-cebu',
    ownerId: 'emp-pedro',
    createdAt: '2026-08-22T08:30:00.000Z',
    updatedAt: '2026-08-30T13:10:00.000Z',
    color: '#0891b2',
  },

  // Mark Reyes Folders
  {
    id: 'folder-mark-naga',
    name: 'Naga Project',
    parentId: null,
    ownerId: 'emp-mark',
    createdAt: '2026-08-23T09:00:00.000Z',
    updatedAt: '2026-08-30T10:00:00.000Z',
    color: '#2563eb',
  },
  {
    id: 'folder-mark-permits',
    name: 'Work Permits',
    parentId: 'folder-mark-naga',
    ownerId: 'emp-mark',
    createdAt: '2026-08-23T09:15:00.000Z',
    updatedAt: '2026-08-31T07:45:00.000Z',
    color: '#9333ea',
  },

  // Shared Company Documents Folders
  {
    id: 'folder-shared-policies',
    name: 'Company Policies',
    parentId: null,
    ownerId: 'shared',
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    color: '#475569',
  },
  {
    id: 'folder-shared-safety',
    name: 'Safety Documents',
    parentId: null,
    ownerId: 'shared',
    createdAt: '2026-08-15T08:15:00.000Z',
    updatedAt: '2026-08-28T11:20:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-shared-forms',
    name: 'Standard Forms',
    parentId: null,
    ownerId: 'shared',
    createdAt: '2026-08-15T08:30:00.000Z',
    updatedAt: '2026-08-27T09:00:00.000Z',
    color: '#d97706',
  },
  {
    id: 'folder-shared-emergency',
    name: 'Emergency Procedures',
    parentId: null,
    ownerId: 'shared',
    createdAt: '2026-08-15T08:45:00.000Z',
    updatedAt: '2026-08-29T14:30:00.000Z',
    color: '#dc2626',
  },
  {
    id: 'folder-shared-training',
    name: 'Training Materials',
    parentId: null,
    ownerId: 'shared',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-26T16:15:00.000Z',
    color: '#7c3aed',
  },
]

export const INITIAL_DOCUMENTS: Document[] = [
  // Juan Dela Cruz - Safety Folder
  {
    id: 'doc-juan-1',
    name: 'Safety Orientation.pdf',
    originalName: 'Safety Orientation Naga 2026.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 2516582, // 2.4 MB
    sizeFormatted: '2.4 MB',
    folderId: 'folder-juan-safety',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-21T09:30:00.000Z',
    updatedAt: '2026-08-29T10:15:00.000Z',
    version: 'v2.1',
    isShared: false,
    assignedTo: ['emp-juan', 'emp-mark'],
    tags: ['Safety', 'Mandatory', 'Naga'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 14,
    textContent: `DBB FIELD OPERATIONS - SITE SAFETY ORIENTATION (NAGA PROJECT)
Document Version: 2.1 | Approved by: Engineering Operations

1. GENERAL SITE DIRECTIVES
All personnel entering the Naga Project Site Phase 2 must possess an authorized electronic badge and current DBB FieldHub credentials.

2. MANDATORY PERSONAL PROTECTIVE EQUIPMENT (PPE)
- Hard Hat (Class E electrical rating required in substation zone)
- High-visibility reflective vest (Orange for engineers, Yellow for visitors)
- Steel-toe boots with puncture-resistant soles (ASTM F2413 standard)
- Safety goggles with side shields for grinding and cutting operations

3. HAZARD COMMUNICATION & INCIDENT REPORTING
Any near-miss incident or equipment malfunction must be logged within 2 hours using the FieldHub digital reporting channel.`,
  },
  {
    id: 'doc-juan-2',
    name: 'Emergency Procedure.pdf',
    originalName: 'Emergency Response Plan Naga Site.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1887436, // 1.8 MB
    sizeFormatted: '1.8 MB',
    folderId: 'folder-juan-safety',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-juan'],
    tags: ['Emergency', 'Protocol'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 8,
    textContent: `DBB FIELD OPERATIONS - EMERGENCY RESPONSE PROTOCOLS
Site: Naga Commercial & Logistics Center Phase 2

PRIMARY EMERGENCY CONTACTS:
- Site Emergency Response Coordinator: +63 917 555 0199
- Naga City Central Fire Station: (054) 881-2244 / 160
- Naga Bicol Medical Center Emergency: (054) 472-0400
- DBB Central Operations Hotline: +63 2 8888 0100

EVACUATION ASSEMBLY AREAS:
Assembly Point A: North Parking Zone adjacent to Gate 1
Assembly Point B: Open Grassland Zone west of Substation B`,
  },
  {
    id: 'doc-juan-3',
    name: 'Site Safety Rules.pdf',
    originalName: 'Site Safety Rules - Naga Operations.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1258291, // 1.2 MB
    sizeFormatted: '1.2 MB',
    folderId: 'folder-juan-safety',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-22T08:45:00.000Z',
    updatedAt: '2026-08-22T08:45:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-juan'],
    tags: ['Rules', 'Compliance'],
    offlineCached: false,
    pageCount: 6,
    textContent: `DBB SITE SAFETY RULES & REGULATIONS
Strict zero-tolerance policy on safety non-compliance. Daily toolbox meetings mandatory at 07:30 AM before commencement of heavy machinery operations.`,
  },

  // Juan Dela Cruz - Drawings Folder
  {
    id: 'doc-juan-4',
    name: 'Foundation Plan Rev-2.pdf',
    originalName: 'Naga Foundation Structural Plan Rev 2.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 4718592, // 4.5 MB
    sizeFormatted: '4.5 MB',
    folderId: 'folder-juan-drawings',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-24T14:10:00.000Z',
    updatedAt: '2026-08-27T09:30:00.000Z',
    version: 'v2.0',
    assignedTo: ['emp-juan', 'emp-mark'],
    tags: ['Structural', 'Blueprint', 'Naga'],
    offlineCached: true,
    pageCount: 12,
    textContent: `STRUCTURAL BLUEPRINT: NAGA LOGISTICS CENTER
Grid Axis: A-1 through J-14 | Footing Thickness: 900mm Grade 60 Rebar
Reinforcement Specification: ASTM A615 Grade 60 High Strength Deformed Steel
Bearing Capacity Verification: 250 kPa sustained.`,
  },
  {
    id: 'doc-juan-5',
    name: 'Naga Project Layout.jpg',
    originalName: 'Naga Project Aerial Layout Site.jpg',
    mimeType: 'image/jpeg',
    type: 'image',
    size: 1992294, // 1.9 MB
    sizeFormatted: '1.9 MB',
    folderId: 'folder-juan-drawings',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-25T11:20:00.000Z',
    updatedAt: '2026-08-25T11:20:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-juan'],
    tags: ['Photo', 'Layout', 'Site'],
    offlineCached: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=1600&auto=format&fit=crop&q=80',
  },

  // Juan Dela Cruz - Permits Folder
  {
    id: 'doc-juan-6',
    name: 'Work Permit.pdf',
    originalName: 'Naga Phase 2 Work Permit Approved.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1572864, // 1.5 MB
    sizeFormatted: '1.5 MB',
    folderId: 'folder-juan-permits',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-26T16:00:00.000Z',
    updatedAt: '2026-08-30T11:45:00.000Z',
    version: 'v1.2',
    assignedTo: ['emp-juan'],
    tags: ['Permits', 'Government', 'Approved'],
    offlineCached: true,
    pageCount: 4,
    textContent: `CITY BUILDING OFFICIAL - NAGA CITY
SPECIAL WORK PERMIT # WP-2026-0884-NC
Applicant: DBB Field & Construction Corporation
Project: Commercial Logistics Depot Phase 2
Validity: August 1, 2026 - December 31, 2026
Approved For: Deep Foundation Piling, Structural Erection, Site Drainage.`,
  },
  {
    id: 'doc-juan-7',
    name: 'Site Photo.jpg',
    originalName: 'Naga Groundwork Concrete Pouring.jpg',
    mimeType: 'image/jpeg',
    type: 'image',
    size: 1887436, // 1.8 MB
    sizeFormatted: '1.8 MB',
    folderId: 'folder-juan-photos',
    ownerId: 'emp-juan',
    uploadedBy: {
      id: 'emp-juan',
      name: 'Juan Dela Cruz',
      role: 'employee',
    },
    createdAt: '2026-08-31T08:10:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-juan'],
    tags: ['Site', 'Photo', 'Inspection'],
    offlineCached: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80',
  },

  // Pedro Santos - Safety Folder
  {
    id: 'doc-pedro-1',
    name: 'Cebu PPE Compliance Guide.pdf',
    originalName: 'Cebu Port Marine Safety & PPE Guide.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 2097152, // 2.0 MB
    sizeFormatted: '2.0 MB',
    folderId: 'folder-pedro-safety',
    ownerId: 'emp-pedro',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-23T10:00:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
    version: 'v1.1',
    assignedTo: ['emp-pedro'],
    tags: ['Safety', 'Cebu', 'Marine'],
    offlineCached: true,
    pageCount: 10,
    textContent: `CEBU COMMERCIAL PORT EXPANSION - MARINE SAFETY STANDARDS
All workers within 10 meters of shoreline or barge must wear Type III Coast Guard approved life jackets in addition to standard field safety gear.`,
  },
  {
    id: 'doc-pedro-2',
    name: 'Cebu Pier Foundation Photo.jpg',
    originalName: 'Cebu Pier Underwater Piling Inspection.jpg',
    mimeType: 'image/jpeg',
    type: 'image',
    size: 2621440, // 2.5 MB
    sizeFormatted: '2.5 MB',
    folderId: 'folder-pedro-photos',
    ownerId: 'emp-pedro',
    uploadedBy: {
      id: 'emp-pedro',
      name: 'Pedro Santos',
      role: 'employee',
    },
    createdAt: '2026-08-30T13:10:00.000Z',
    updatedAt: '2026-08-30T13:10:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-pedro'],
    tags: ['Cebu', 'Inspection', 'Photo'],
    offlineCached: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1600&auto=format&fit=crop&q=80',
  },

  // Mark Reyes - Work Permits Folder
  {
    id: 'doc-mark-1',
    name: 'Naga Excavation Work Permit.pdf',
    originalName: 'Approved Deep Trench Permit Naga.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1677721, // 1.6 MB
    sizeFormatted: '1.6 MB',
    folderId: 'folder-mark-permits',
    ownerId: 'emp-mark',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-24T11:00:00.000Z',
    updatedAt: '2026-08-31T07:45:00.000Z',
    version: 'v1.0',
    assignedTo: ['emp-mark'],
    tags: ['Permit', 'Excavation'],
    offlineCached: true,
    pageCount: 5,
    textContent: `EXCAVATION & TRENCHING PERMIT # TR-2026-302
Depth: 4.2 meters | Location: Sector B Logistics Foundation
Shoring and trench box installation verified by Mark Reyes. Soil test classification: Type B granular.`,
  },

  // Company-wide Shared Documents
  {
    id: 'doc-shared-1',
    name: 'Field Safety Handbook.pdf',
    originalName: 'DBB 2026 Corporate Field Safety Handbook.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 3670016, // 3.5 MB
    sizeFormatted: '3.5 MB',
    folderId: 'folder-shared-safety',
    ownerId: 'shared',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-16T08:00:00.000Z',
    updatedAt: '2026-08-28T11:20:00.000Z',
    version: 'v4.0',
    isShared: true,
    assignedTo: ['emp-juan', 'emp-pedro', 'emp-mark'],
    tags: ['Handbook', 'Company-Wide', 'Safety'],
    offlineCached: true,
    pageCount: 36,
    textContent: `DBB FIELD & ENGINEERING CORPORATION
COMPREHENSIVE FIELD SAFETY HANDBOOK (EDITION 2026)
This handbook establishes standard operating safety procedures across all Luzon, Visayas, and Mindanao construction sites. Compliance is binding on all employees, subcontractors, and visiting technical inspectors.`,
  },
  {
    id: 'doc-shared-2',
    name: 'Daily Tool Box Meeting Form.xlsx',
    originalName: 'DBB-FRM-SAF-002 Daily Tool Box Meeting.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    type: 'excel',
    size: 524288, // 512 KB
    sizeFormatted: '512 KB',
    folderId: 'folder-shared-forms',
    ownerId: 'shared',
    uploadedBy: {
      id: 'user-admin-1',
      name: 'Maria Clara',
      role: 'admin',
    },
    createdAt: '2026-08-16T09:00:00.000Z',
    updatedAt: '2026-08-27T09:00:00.000Z',
    version: 'v2.0',
    isShared: true,
    assignedTo: ['emp-juan', 'emp-pedro', 'emp-mark'],
    tags: ['Form', 'Daily', 'Safety'],
    offlineCached: false,
    textContent: `SPREADSHEET FORM: DAILY TOOLBOX MEETING LOG
Columns: [Date] [Project Site] [Supervisor] [Topic Discussed] [Attendees Count] [Identified Hazards] [Mitigation Actions] [Signatures]`,
  },
]

export const INITIAL_COMMENTS: DocumentComment[] = [
  {
    id: 'comment-1',
    documentId: 'doc-juan-1',
    authorId: 'emp-juan',
    authorName: 'Juan Dela Cruz',
    authorRole: 'employee',
    content: 'This section on substation PPE needs clarification for our night shift crew.',
    createdAt: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'comment-2',
    documentId: 'doc-juan-1',
    authorId: 'user-admin-1',
    authorName: 'Maria Clara',
    authorRole: 'admin',
    content: 'Updated instructions for night shift lighting & arc flash rating will be uploaded in v2.2 today.',
    createdAt: '2026-08-29T11:00:00.000Z',
  },
  {
    id: 'comment-3',
    documentId: 'doc-juan-4',
    authorId: 'emp-mark',
    authorName: 'Mark Reyes',
    authorRole: 'employee',
    content: 'Grid Axis D-4 footing rebar spacing verified on site. Complies with Rev-2 specs.',
    createdAt: '2026-08-30T14:30:00.000Z',
  },
]

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'upload',
    userId: 'user-admin-1',
    userName: 'Maria Clara',
    userRole: 'admin',
    actionTitle: 'Uploaded Safety Orientation.pdf',
    description: 'Uploaded Safety Orientation.pdf to Juan Dela Cruz / Naga Project / Safety',
    targetName: 'Safety Orientation.pdf',
    targetId: 'doc-juan-1',
    employeeName: 'Juan Dela Cruz',
    timestamp: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'act-2',
    type: 'assign',
    userId: 'user-admin-1',
    userName: 'Maria Clara',
    userRole: 'admin',
    actionTitle: 'Assigned Document',
    description: 'Assigned Foundation Plan Rev-2.pdf to Mark Reyes & Juan Dela Cruz',
    targetName: 'Foundation Plan Rev-2.pdf',
    targetId: 'doc-juan-4',
    employeeName: 'Mark Reyes, Juan Dela Cruz',
    timestamp: '2026-08-30T09:00:00.000Z',
  },
  {
    id: 'act-3',
    type: 'comment',
    userId: 'emp-juan',
    userName: 'Juan Dela Cruz',
    userRole: 'employee',
    actionTitle: 'New Document Comment',
    description: 'Commented on Safety Orientation.pdf',
    targetName: 'Safety Orientation.pdf',
    targetId: 'doc-juan-1',
    employeeName: 'Juan Dela Cruz',
    timestamp: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'act-4',
    type: 'offline_sync',
    userId: 'emp-juan',
    userName: 'Juan Dela Cruz',
    userRole: 'employee',
    actionTitle: 'Offline Cache Updated',
    description: 'Downloaded Safety Orientation.pdf & Emergency Procedure.pdf for offline use',
    targetName: 'Naga Project Safety Files',
    employeeName: 'Juan Dela Cruz',
    timestamp: '2026-08-31T06:00:00.000Z',
  },
]

// Open IndexedDB instance
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase

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

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Generic IndexedDB CRUD helpers
export const storage = {
  async init(): Promise<void> {
    const db = await openDB()
    const tx = db.transaction([STORES.USERS, STORES.FOLDERS, STORES.DOCUMENTS, STORES.COMMENTS, STORES.ACTIVITIES], 'readwrite')
    
    // Seed Users if empty
    const userStore = tx.objectStore(STORES.USERS)
    const userCountReq = userStore.count()
    userCountReq.onsuccess = () => {
      if (userCountReq.result === 0) {
        INITIAL_USERS.forEach((u) => userStore.put(u))
      }
    }

    // Seed Folders if empty
    const folderStore = tx.objectStore(STORES.FOLDERS)
    const folderCountReq = folderStore.count()
    folderCountReq.onsuccess = () => {
      if (folderCountReq.result === 0) {
        INITIAL_FOLDERS.forEach((f) => folderStore.put(f))
      }
    }

    // Seed Documents if empty
    const docStore = tx.objectStore(STORES.DOCUMENTS)
    const docCountReq = docStore.count()
    docCountReq.onsuccess = () => {
      if (docCountReq.result === 0) {
        INITIAL_DOCUMENTS.forEach((d) => docStore.put(d))
      }
    }

    // Seed Comments if empty
    const commentStore = tx.objectStore(STORES.COMMENTS)
    const commentCountReq = commentStore.count()
    commentCountReq.onsuccess = () => {
      if (commentCountReq.result === 0) {
        INITIAL_COMMENTS.forEach((c) => commentStore.put(c))
      }
    }

    // Seed Activities if empty
    const actStore = tx.objectStore(STORES.ACTIVITIES)
    const actCountReq = actStore.count()
    actCountReq.onsuccess = () => {
      if (actCountReq.result === 0) {
        INITIAL_ACTIVITIES.forEach((a) => actStore.put(a))
      }
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
