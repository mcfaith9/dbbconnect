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

export const INITIAL_FOLDERS: Folder[] = [
  // Marc Louie Cabigas Folders (employee-001)
  {
    id: 'folder-marc-naga',
    name: 'Naga Project Phase 2',
    parentId: null,
    ownerId: 'employee-001',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z',
    color: '#2563eb',
  },
  {
    id: 'folder-marc-safety',
    name: 'Safety & Compliance',
    parentId: 'folder-marc-naga',
    ownerId: 'employee-001',
    createdAt: '2026-08-20T08:30:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-marc-drawings',
    name: 'Engineering Blueprints',
    parentId: 'folder-marc-naga',
    ownerId: 'employee-001',
    createdAt: '2026-08-20T08:35:00.000Z',
    updatedAt: '2026-08-27T14:20:00.000Z',
    color: '#ea580c',
  },
  {
    id: 'folder-marc-permits',
    name: 'Permits & Approvals',
    parentId: 'folder-marc-naga',
    ownerId: 'employee-001',
    createdAt: '2026-08-20T08:40:00.000Z',
    updatedAt: '2026-08-30T11:45:00.000Z',
    color: '#9333ea',
  },
  {
    id: 'folder-marc-photos',
    name: 'Site Progress Photos',
    parentId: 'folder-marc-naga',
    ownerId: 'employee-001',
    createdAt: '2026-08-21T09:00:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    color: '#0891b2',
  },

  // Juan Dela Cruz Folders (employee-002)
  {
    id: 'folder-juan-naga',
    name: 'Naga Project',
    parentId: null,
    ownerId: 'employee-002',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z',
    color: '#2563eb',
  },
  {
    id: 'folder-juan-safety',
    name: 'Safety',
    parentId: 'folder-juan-naga',
    ownerId: 'employee-002',
    createdAt: '2026-08-20T08:30:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-juan-drawings',
    name: 'Drawings',
    parentId: 'folder-juan-naga',
    ownerId: 'employee-002',
    createdAt: '2026-08-20T08:35:00.000Z',
    updatedAt: '2026-08-27T14:20:00.000Z',
    color: '#ea580c',
  },
  {
    id: 'folder-juan-permits',
    name: 'Permits',
    parentId: 'folder-juan-naga',
    ownerId: 'employee-002',
    createdAt: '2026-08-20T08:40:00.000Z',
    updatedAt: '2026-08-30T11:45:00.000Z',
    color: '#9333ea',
  },
  {
    id: 'folder-juan-photos',
    name: 'Photos',
    parentId: 'folder-juan-naga',
    ownerId: 'employee-002',
    createdAt: '2026-08-21T09:00:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    color: '#0891b2',
  },

  // Pedro Santos Folders (employee-003)
  {
    id: 'folder-pedro-cebu',
    name: 'Cebu Project',
    parentId: null,
    ownerId: 'employee-003',
    createdAt: '2026-08-22T08:00:00.000Z',
    updatedAt: '2026-08-29T15:30:00.000Z',
    color: '#059669',
  },
  {
    id: 'folder-pedro-safety',
    name: 'Safety',
    parentId: 'folder-pedro-cebu',
    ownerId: 'employee-003',
    createdAt: '2026-08-22T08:15:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'folder-pedro-photos',
    name: 'Photos',
    parentId: 'folder-pedro-cebu',
    ownerId: 'employee-003',
    createdAt: '2026-08-22T08:30:00.000Z',
    updatedAt: '2026-08-30T13:10:00.000Z',
    color: '#0891b2',
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
  // Marc Louie Cabigas - Assigned Files (employee-001)
  {
    id: 'doc-marc-1',
    name: 'Naga Structural Blueprint Rev-3.pdf',
    originalName: 'Naga Phase 2 Main Facility Blueprint.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 5242880, // 5.0 MB
    sizeFormatted: '5.0 MB',
    folderId: 'folder-marc-drawings',
    ownerId: 'employee-001',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-21T08:30:00.000Z',
    updatedAt: '2026-08-29T11:00:00.000Z',
    version: 'v3.0',
    isShared: false,
    assignedTo: ['employee-001'],
    tags: ['Structural', 'Blueprint', 'Phase 2'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 18,
    textContent: `DBB FIELD OPERATIONS - NAGA PROJECT PHASE 2
STRUCTURAL ENGINEERING BLUEPRINTS & PILING SPECS
Lead Field Engineer: Marc Louie Cabigas | Supervising Office: DMBB Administration

1. GENERAL DESIGN CRITERIA
- Heavy industrial load capacity 350 kN/m²
- Subgrade compaction verification required prior to pad pouring.
- Rebar grade: ASTM A615 Grade 60 with anti-corrosion marine coating.`,
  },
  {
    id: 'doc-marc-2',
    name: 'Naga Safety Protocols 2026.pdf',
    originalName: 'Naga Site Safety Protocols & Emergency Plan.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 2411724, // 2.3 MB
    sizeFormatted: '2.3 MB',
    folderId: 'folder-marc-safety',
    ownerId: 'employee-001',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-21T09:30:00.000Z',
    updatedAt: '2026-08-29T10:15:00.000Z',
    version: 'v2.1',
    isShared: false,
    assignedTo: ['employee-001', 'employee-002'],
    tags: ['Safety', 'Mandatory', 'Naga'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 14,
    textContent: `DBB FIELD OPERATIONS - SITE SAFETY ORIENTATION (NAGA PROJECT)
Approved by: DMBB Administration & DBB Engineering

1. GENERAL SITE DIRECTIVES
All personnel entering the Naga Project Site Phase 2 must possess an authorized electronic badge and current DBB FieldHub credentials.`,
  },
  {
    id: 'doc-marc-3',
    name: 'Naga Excavation Work Permit.pdf',
    originalName: 'Approved Deep Trench Permit Naga Phase 2.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1677721, // 1.6 MB
    sizeFormatted: '1.6 MB',
    folderId: 'folder-marc-permits',
    ownerId: 'employee-001',
    uploadedBy: {
      id: 'admin-002',
      name: 'DBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-24T11:00:00.000Z',
    updatedAt: '2026-08-31T07:45:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-001'],
    tags: ['Permit', 'Excavation', 'Approved'],
    offlineCached: true,
    pageCount: 5,
    textContent: `EXCAVATION & TRENCHING PERMIT # TR-2026-302
Depth: 4.2 meters | Location: Sector B Logistics Foundation
Lead Inspector: Marc Louie Cabigas. Soil test classification: Type B granular.`,
  },
  {
    id: 'doc-marc-4',
    name: 'Naga Phase 2 Aerial Layout.jpg',
    originalName: 'Naga Project Aerial Layout Site.jpg',
    mimeType: 'image/jpeg',
    type: 'image',
    size: 1992294, // 1.9 MB
    sizeFormatted: '1.9 MB',
    folderId: 'folder-marc-drawings',
    ownerId: 'employee-001',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-25T11:20:00.000Z',
    updatedAt: '2026-08-25T11:20:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-001'],
    tags: ['Photo', 'Layout', 'Site'],
    offlineCached: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-marc-5',
    name: 'Foundation Pouring Inspection.jpg',
    originalName: 'Naga Groundwork Concrete Pouring.jpg',
    mimeType: 'image/jpeg',
    type: 'image',
    size: 1887436, // 1.8 MB
    sizeFormatted: '1.8 MB',
    folderId: 'folder-marc-photos',
    ownerId: 'employee-001',
    uploadedBy: {
      id: 'employee-001',
      name: 'Marc Louie Cabigas',
      role: 'employee',
    },
    createdAt: '2026-08-31T08:10:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-001'],
    tags: ['Site', 'Photo', 'Inspection'],
    offlineCached: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80',
  },

  // Juan Dela Cruz - Safety Folder (employee-002)
  {
    id: 'doc-juan-1',
    name: 'Safety Orientation.pdf',
    originalName: 'Safety Orientation Naga 2026.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 2516582, // 2.4 MB
    sizeFormatted: '2.4 MB',
    folderId: 'folder-juan-safety',
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-21T09:30:00.000Z',
    updatedAt: '2026-08-29T10:15:00.000Z',
    version: 'v2.1',
    isShared: false,
    assignedTo: ['employee-002', 'employee-001'],
    tags: ['Safety', 'Mandatory', 'Naga'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 14,
    textContent: `DBB FIELD OPERATIONS - SITE SAFETY ORIENTATION (NAGA PROJECT)
Document Version: 2.1 | Approved by: Engineering Operations

1. GENERAL SITE DIRECTIVES
All personnel entering the Naga Project Site Phase 2 must possess an authorized electronic badge and current DBB FieldHub credentials.`,
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
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-002'],
    tags: ['Emergency', 'Protocol'],
    offlineCached: true,
    offlineCachedAt: '2026-08-31T06:00:00.000Z',
    pageCount: 8,
    textContent: `DBB FIELD OPERATIONS - EMERGENCY RESPONSE PROTOCOLS
Site: Naga Commercial & Logistics Center Phase 2

PRIMARY EMERGENCY CONTACTS:
- Site Emergency Response Coordinator: +63 917 555 0199
- Naga City Central Fire Station: (054) 881-2244 / 160`,
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
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-22T08:45:00.000Z',
    updatedAt: '2026-08-22T08:45:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-002'],
    tags: ['Rules', 'Compliance'],
    offlineCached: false,
    pageCount: 6,
    textContent: `DBB SITE SAFETY RULES & REGULATIONS
Strict zero-tolerance policy on safety non-compliance. Daily toolbox meetings mandatory at 07:30 AM before commencement of heavy machinery operations.`,
  },
  {
    id: 'doc-juan-4',
    name: 'Foundation Plan Rev-2.pdf',
    originalName: 'Naga Foundation Structural Plan Rev 2.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 4718592, // 4.5 MB
    sizeFormatted: '4.5 MB',
    folderId: 'folder-juan-drawings',
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-24T14:10:00.000Z',
    updatedAt: '2026-08-27T09:30:00.000Z',
    version: 'v2.0',
    assignedTo: ['employee-002', 'employee-001'],
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
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-25T11:20:00.000Z',
    updatedAt: '2026-08-25T11:20:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-002'],
    tags: ['Photo', 'Layout', 'Site'],
    offlineCached: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-juan-6',
    name: 'Work Permit.pdf',
    originalName: 'Naga Phase 2 Work Permit Approved.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 1572864, // 1.5 MB
    sizeFormatted: '1.5 MB',
    folderId: 'folder-juan-permits',
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-26T16:00:00.000Z',
    updatedAt: '2026-08-30T11:45:00.000Z',
    version: 'v1.2',
    assignedTo: ['employee-002'],
    tags: ['Permits', 'Government', 'Approved'],
    offlineCached: true,
    pageCount: 4,
    textContent: `CITY BUILDING OFFICIAL - NAGA CITY
SPECIAL WORK PERMIT # WP-2026-0884-NC
Applicant: DBB Field & Construction Corporation
Project: Commercial Logistics Depot Phase 2`,
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
    ownerId: 'employee-002',
    uploadedBy: {
      id: 'employee-002',
      name: 'Juan Dela Cruz',
      role: 'employee',
    },
    createdAt: '2026-08-31T08:10:00.000Z',
    updatedAt: '2026-08-31T08:10:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-002'],
    tags: ['Site', 'Photo', 'Inspection'],
    offlineCached: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80',
  },

  // Pedro Santos - Safety Folder (employee-003)
  {
    id: 'doc-pedro-1',
    name: 'Cebu PPE Compliance Guide.pdf',
    originalName: 'Cebu Port Marine Safety & PPE Guide.pdf',
    mimeType: 'application/pdf',
    type: 'pdf',
    size: 2097152, // 2.0 MB
    sizeFormatted: '2.0 MB',
    folderId: 'folder-pedro-safety',
    ownerId: 'employee-003',
    uploadedBy: {
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-23T10:00:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
    version: 'v1.1',
    assignedTo: ['employee-003'],
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
    ownerId: 'employee-003',
    uploadedBy: {
      id: 'employee-003',
      name: 'Pedro Santos',
      role: 'employee',
    },
    createdAt: '2026-08-30T13:10:00.000Z',
    updatedAt: '2026-08-30T13:10:00.000Z',
    version: 'v1.0',
    assignedTo: ['employee-003'],
    tags: ['Cebu', 'Inspection', 'Photo'],
    offlineCached: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1600&auto=format&fit=crop&q=80',
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
      id: 'admin-001',
      name: 'DMBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-16T08:00:00.000Z',
    updatedAt: '2026-08-28T11:20:00.000Z',
    version: 'v4.0',
    isShared: true,
    assignedTo: ['employee-001', 'employee-002', 'employee-003'],
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
      id: 'admin-002',
      name: 'DBB Administrator',
      role: 'admin',
    },
    createdAt: '2026-08-16T09:00:00.000Z',
    updatedAt: '2026-08-27T09:00:00.000Z',
    version: 'v2.0',
    isShared: true,
    assignedTo: ['employee-001', 'employee-002', 'employee-003'],
    tags: ['Form', 'Daily', 'Safety'],
    offlineCached: false,
    textContent: `SPREADSHEET FORM: DAILY TOOLBOX MEETING LOG
Columns: [Date] [Project Site] [Supervisor] [Topic Discussed] [Attendees Count] [Identified Hazards] [Mitigation Actions] [Signatures]`,
  },
]

export const INITIAL_COMMENTS: DocumentComment[] = [
  {
    id: 'comment-1',
    documentId: 'doc-marc-1',
    authorId: 'employee-001',
    authorName: 'Marc Louie Cabigas',
    authorRole: 'employee',
    content: 'Piling depth on Sector B logistics footing verified at 4.2m with site subgrade inspection.',
    createdAt: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'comment-2',
    documentId: 'doc-marc-1',
    authorId: 'admin-001',
    authorName: 'DMBB Administrator',
    authorRole: 'admin',
    content: 'Noted Engr. Marc. Structural revision 3 approved for concrete pour.',
    createdAt: '2026-08-29T11:00:00.000Z',
  },
  {
    id: 'comment-3',
    documentId: 'doc-juan-1',
    authorId: 'employee-002',
    authorName: 'Juan Dela Cruz',
    authorRole: 'employee',
    content: 'Night shift arc flash rating verified with safety office.',
    createdAt: '2026-08-30T14:30:00.000Z',
  },
]

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'upload',
    userId: 'admin-001',
    userName: 'DMBB Administrator',
    userRole: 'admin',
    actionTitle: 'Uploaded Naga Structural Blueprint Rev-3.pdf',
    description: 'Uploaded blueprint to Marc Louie Cabigas / Naga Project Phase 2 / Engineering Blueprints',
    targetName: 'Naga Structural Blueprint Rev-3.pdf',
    targetId: 'doc-marc-1',
    employeeName: 'Marc Louie Cabigas',
    timestamp: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'act-2',
    type: 'assign',
    userId: 'admin-001',
    userName: 'DMBB Administrator',
    userRole: 'admin',
    actionTitle: 'Assigned Document',
    description: 'Assigned Naga Safety Protocols 2026.pdf to Marc Louie Cabigas & Juan Dela Cruz',
    targetName: 'Naga Safety Protocols 2026.pdf',
    targetId: 'doc-marc-2',
    employeeName: 'Marc Louie Cabigas, Juan Dela Cruz',
    timestamp: '2026-08-30T09:00:00.000Z',
  },
  {
    id: 'act-3',
    type: 'comment',
    userId: 'employee-001',
    userName: 'Marc Louie Cabigas',
    userRole: 'employee',
    actionTitle: 'New Document Comment',
    description: 'Commented on Naga Structural Blueprint Rev-3.pdf',
    targetName: 'Naga Structural Blueprint Rev-3.pdf',
    targetId: 'doc-marc-1',
    employeeName: 'Marc Louie Cabigas',
    timestamp: '2026-08-29T10:15:00.000Z',
  },
  {
    id: 'act-4',
    type: 'offline_sync',
    userId: 'employee-001',
    userName: 'Marc Louie Cabigas',
    userRole: 'employee',
    actionTitle: 'Offline Cache Updated',
    description: 'Cached Naga Structural Blueprint Rev-3.pdf & Safety Protocols for offline field use',
    targetName: 'Naga Project Phase 2 Blueprints',
    employeeName: 'Marc Louie Cabigas',
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
    
    // Seed Users
    const userStore = tx.objectStore(STORES.USERS)
    INITIAL_USERS.forEach((u) => userStore.put(u))

    // Seed Folders
    const folderStore = tx.objectStore(STORES.FOLDERS)
    const folderCountReq = folderStore.count()
    folderCountReq.onsuccess = () => {
      if (folderCountReq.result === 0) {
        INITIAL_FOLDERS.forEach((f) => folderStore.put(f))
      } else {
        // Ensure core initial folders exist
        INITIAL_FOLDERS.forEach((f) => {
          const req = folderStore.get(f.id)
          req.onsuccess = () => {
            if (!req.result) folderStore.put(f)
          }
        })
      }
    }

    // Seed Documents
    const docStore = tx.objectStore(STORES.DOCUMENTS)
    const docCountReq = docStore.count()
    docCountReq.onsuccess = () => {
      if (docCountReq.result === 0) {
        INITIAL_DOCUMENTS.forEach((d) => docStore.put(d))
      } else {
        // Ensure core initial documents exist
        INITIAL_DOCUMENTS.forEach((d) => {
          const req = docStore.get(d.id)
          req.onsuccess = () => {
            if (!req.result) docStore.put(d)
          }
        })
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
