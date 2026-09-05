<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UsersRound,
  UserRound,
  Grid,
  List as ListIcon,
  FolderPlus,
  Upload,
  Folder,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Search,
  ArrowLeft,
  Trash2,
  Edit2,
  FolderSymlink,
  Download,
  Eye,
  UserCheck,
  FolderOpen,
  AlertCircle,
  TrendingUp,
  Copy,
  X,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import NewFolderModal from '@/components/modals/NewFolderModal.vue'
import UploadFilesModal from '@/components/modals/UploadFilesModal.vue'
import AssignDocumentModal from '@/components/modals/AssignDocumentModal.vue'
import MoveItemModal from '@/components/modals/MoveItemModal.vue'
import RenameItemModal from '@/components/modals/RenameItemModal.vue'
import DocumentPreviewModal from '@/components/modals/DocumentPreviewModal.vue'

import { UserService } from '@/services/UserService'
import { FolderService } from '@/services/FolderService'
import { DocumentService } from '@/services/DocumentService'
import { AssignmentService } from '@/services/AssignmentService'
import { ActivityService } from '@/services/ActivityService'
import { useAuth } from '@/composables/useAuth'
import type { User, Folder as FolderType, Document as DocumentType, BreadcrumbCrumb } from '@/types'

const route = useRoute()
const router = useRouter()
const { currentUser, isAdmin } = useAuth()

// State
const employees = ref<User[]>([])
const allAssignedFolders = ref<FolderType[]>([])
const targetEmployeeForNewFolder = ref<User | null>(null)

const selectedEmployee = ref<User | null>(null)
const currentFolderId = ref<string | null>(null)
const currentFolder = ref<FolderType | null>(null)

const folders = ref<FolderType[]>([])
const documents = ref<DocumentType[]>([])
const breadcrumbs = ref<BreadcrumbCrumb[]>([])

// Workspace view controls (When viewing an employee)
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'name' | 'date' | 'size'>('name')
const isLoading = ref(true)

// Directory view controls (When viewing all employees)
const directoryViewMode = ref<'grid' | 'list'>(
  typeof localStorage !== 'undefined' && localStorage.getItem('field_manager_view_mode') === 'list'
    ? 'list'
    : 'grid',
)

const setDirectoryViewMode = (mode: 'grid' | 'list') => {
  directoryViewMode.value = mode
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('field_manager_view_mode', mode)
  }
}

// Directory Search, Filters & Sorting
const directorySearchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive' | 'pending'>('all')
const departmentFilter = ref<string>('all')
const workloadFilter = ref<'all' | 'none' | 'low' | 'medium' | 'high'>('all')
const directorySortBy = ref<
  'name-asc' | 'name-desc' | 'folders-desc' | 'folders-asc' | 'status' | 'activity'
>('name-asc')

// Modals
const isNewFolderModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isAssignModalOpen = ref(false)
const isMoveModalOpen = ref(false)
const isRenameModalOpen = ref(false)
const isPreviewModalOpen = ref(false)

const activeDocumentForAction = ref<DocumentType | null>(null)
const activeItemForAction = ref<FolderType | DocumentType | null>(null)
const activeItemType = ref<'folder' | 'document'>('document')

// Load initial data
const loadEmployees = async () => {
  const [fieldUsers, allFoldersRes] = await Promise.all([
    UserService.getFieldEmployees(),
    FolderService.getAllFolders(),
  ])
  employees.value = fieldUsers
  allAssignedFolders.value = allFoldersRes
}

const loadWorkspaceData = async () => {
  const employeeId = route.params.employeeId as string | undefined
  const folderId = (route.params.folderId as string | undefined) || null

  currentFolderId.value = folderId

  if (employeeId) {
    selectedEmployee.value = (await UserService.getUserById(employeeId)) || null
    if (folderId) {
      currentFolder.value = await FolderService.getFolderById(folderId)
    } else {
      currentFolder.value = null
    }

    // Load child folders and documents
    folders.value = await FolderService.getChildFolders(folderId, employeeId)
    documents.value = await DocumentService.getDocumentsByFolder(folderId, employeeId)
    breadcrumbs.value = await FolderService.getFolderPath(folderId, employeeId, '/field-manager')
  } else {
    selectedEmployee.value = null
    currentFolder.value = null
    folders.value = []
    documents.value = []
    breadcrumbs.value = []
  }
}

const initView = async () => {
  isLoading.value = true
  try {
    await loadEmployees()
    await loadWorkspaceData()
  } finally {
    isLoading.value = false
  }
}

onMounted(initView)

watch(
  () => [route.params.employeeId, route.params.folderId],
  async () => {
    await loadWorkspaceData()
  },
)

// Folders by employee lookup map
const foldersByEmployee = computed(() => {
  const map = new Map<string, FolderType[]>()
  for (const f of allAssignedFolders.value) {
    if (!f.ownerId || f.ownerId === 'shared') continue
    const list = map.get(f.ownerId) || []
    list.push(f)
    map.set(f.ownerId, list)
  }
  return map
})

const getEmployeeFolders = (empId: string): FolderType[] => {
  const list = foldersByEmployee.value.get(empId) || []
  return [...list].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime()
    const timeB = new Date(b.updatedAt || b.createdAt).getTime()
    return timeB - timeA
  })
}

// Workload evaluation
const getWorkloadLevel = (count: number): 'none' | 'low' | 'medium' | 'high' => {
  if (count === 0) return 'none'
  if (count <= 5) return 'low'
  if (count <= 15) return 'medium'
  return 'high'
}

const getWorkloadClass = (count: number) => {
  const lvl = getWorkloadLevel(count)
  switch (lvl) {
    case 'none':
      return 'bg-muted/80 text-muted-foreground border-transparent'
    case 'low':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    case 'medium':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    case 'high':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold'
  }
}

const getEmployeeStatus = (emp: User): 'active' | 'inactive' | 'pending' => {
  return emp.status || 'active'
}

const getStatusBadgeClass = (status: 'active' | 'inactive' | 'pending') => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    case 'inactive':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
    case 'pending':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
  }
}

const getStatusDotClass = (status: 'active' | 'inactive' | 'pending') => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500'
    case 'inactive':
      return 'bg-slate-400'
    case 'pending':
      return 'bg-amber-500'
  }
}

const getEmployeeLastActivity = (emp: User): string => {
  const empFolders = getEmployeeFolders(emp.id)
  if (empFolders.length === 0) return 'No folders assigned'
  const mostRecent = empFolders[0]
  const dateStr = mostRecent.updatedAt || mostRecent.createdAt
  if (!dateStr) return 'Recently active'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Summary Statistics
const totalEmployeesCount = computed(() => employees.value.length)
const activePersonnelCount = computed(
  () => employees.value.filter((e) => getEmployeeStatus(e) === 'active').length,
)
const totalAssignedFoldersCount = computed(
  () => allAssignedFolders.value.filter((f) => f.ownerId && f.ownerId !== 'shared').length,
)
const highWorkloadCount = computed(
  () => employees.value.filter((e) => getEmployeeFolders(e.id).length >= 16).length,
)

// Dynamic Department Options
const availableDepartments = computed(() => {
  const set = new Set<string>()
  for (const emp of employees.value) {
    if (emp.department) set.add(emp.department)
  }
  return Array.from(set).sort()
})

const hasActiveFilters = computed(() => {
  return (
    directorySearchQuery.value.trim() !== '' ||
    statusFilter.value !== 'all' ||
    departmentFilter.value !== 'all' ||
    workloadFilter.value !== 'all' ||
    directorySortBy.value !== 'name-asc'
  )
})

const resetFilters = () => {
  directorySearchQuery.value = ''
  statusFilter.value = 'all'
  departmentFilter.value = 'all'
  workloadFilter.value = 'all'
  directorySortBy.value = 'name-asc'
  currentPage.value = 1
}

// Directory Filtered Employees
const filteredEmployees = computed(() => {
  let list = employees.value

  if (directorySearchQuery.value.trim()) {
    const q = directorySearchQuery.value.toLowerCase().trim()
    list = list.filter((e) => {
      const name = (e.name || '').toLowerCase()
      const username = (e.username || '').toLowerCase()
      const id = (e.id || '').toLowerCase()
      const dept = (e.department || '').toLowerCase()
      const pos = (e.position || '').toLowerCase()
      const proj = (e.assignedProject || '').toLowerCase()
      return (
        name.includes(q) ||
        username.includes(q) ||
        id.includes(q) ||
        dept.includes(q) ||
        pos.includes(q) ||
        proj.includes(q)
      )
    })
  }

  if (statusFilter.value !== 'all') {
    list = list.filter((e) => getEmployeeStatus(e) === statusFilter.value)
  }

  if (departmentFilter.value !== 'all') {
    list = list.filter((e) => (e.department || '') === departmentFilter.value)
  }

  if (workloadFilter.value !== 'all') {
    list = list.filter((e) => {
      const count = getEmployeeFolders(e.id).length
      return getWorkloadLevel(count) === workloadFilter.value
    })
  }

  return [...list].sort((a, b) => {
    if (directorySortBy.value === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '')
    }
    if (directorySortBy.value === 'name-desc') {
      return (b.name || '').localeCompare(a.name || '')
    }
    if (directorySortBy.value === 'folders-desc') {
      return getEmployeeFolders(b.id).length - getEmployeeFolders(a.id).length
    }
    if (directorySortBy.value === 'folders-asc') {
      return getEmployeeFolders(a.id).length - getEmployeeFolders(b.id).length
    }
    if (directorySortBy.value === 'status') {
      return getEmployeeStatus(a).localeCompare(getEmployeeStatus(b))
    }
    if (directorySortBy.value === 'activity') {
      const foldersA = getEmployeeFolders(a.id)
      const foldersB = getEmployeeFolders(b.id)
      const dateA = foldersA[0]?.updatedAt || foldersA[0]?.createdAt || ''
      const dateB = foldersB[0]?.updatedAt || foldersB[0]?.createdAt || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    }
    return 0
  })
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = computed(() => (directoryViewMode.value === 'grid' ? 12 : 15))
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredEmployees.value.length / itemsPerPage.value)),
)
const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredEmployees.value.slice(start, start + itemsPerPage.value)
})

watch(
  [
    directorySearchQuery,
    statusFilter,
    departmentFilter,
    workloadFilter,
    directorySortBy,
    directoryViewMode,
  ],
  () => {
    currentPage.value = 1
  },
)

// Computed list filters (For active employee workspace)
const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return folders.value
  const q = searchQuery.value.toLowerCase().trim()
  return folders.value.filter((f) => f.name.toLowerCase().includes(q))
})

const filteredDocuments = computed(() => {
  let list = documents.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy.value === 'size') {
      return b.size - a.size
    }
    return a.name.localeCompare(b.name)
  })
})

// Navigation Handlers
const openEmployeeWorkspace = (emp: User) => {
  router.push(`/field-manager/${emp.id}`)
}

const openFolder = (folder: FolderType) => {
  if (!selectedEmployee.value) return
  router.push(`/field-manager/${selectedEmployee.value.id}/${folder.id}`)
}

const navigateUp = () => {
  if (!selectedEmployee.value) return
  if (currentFolder.value?.parentId) {
    router.push(`/field-manager/${selectedEmployee.value.id}/${currentFolder.value.parentId}`)
  } else {
    router.push(`/field-manager/${selectedEmployee.value.id}`)
  }
}

const goToEmployeeRoot = () => {
  if (!selectedEmployee.value) return
  router.push(`/field-manager/${selectedEmployee.value.id}`)
}

const backToEmployeeList = () => {
  router.push('/field-manager')
}

const openAssignFolderModal = (emp: User) => {
  targetEmployeeForNewFolder.value = emp
  isNewFolderModalOpen.value = true
}

const copyEmployeeId = async (id: string) => {
  try {
    await navigator.clipboard.writeText(id)
    alert(`Employee ID "${id}" copied to clipboard.`)
  } catch {
    // fallback
  }
}

// Folder Actions
const handleCreateFolder = async (data: { name: string; color: string }) => {
  const targetUser = selectedEmployee.value || targetEmployeeForNewFolder.value
  if (!targetUser) return
  try {
    const newFolder = await FolderService.createFolder({
      name: data.name,
      parentId: selectedEmployee.value ? currentFolderId.value : null,
      ownerId: targetUser.id,
      color: data.color,
    })

    if (selectedEmployee.value) {
      folders.value.push(newFolder)
    }
    allAssignedFolders.value.push(newFolder)

    if (currentUser.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'create_folder',
        actionTitle: 'Folder Created',
        description: `Created folder "${data.name}" for ${targetUser.name}`,
        targetName: data.name,
        targetId: newFolder.id,
        employeeName: targetUser.name,
      })
    }
  } catch (err: any) {
    alert(err.message || 'Failed to create folder on server.')
  } finally {
    targetEmployeeForNewFolder.value = null
  }
}

const openRenameFolder = (folder: FolderType) => {
  activeItemForAction.value = folder
  activeItemType.value = 'folder'
  isRenameModalOpen.value = true
}

const openMoveFolder = (folder: FolderType) => {
  activeItemForAction.value = folder
  activeItemType.value = 'folder'
  isMoveModalOpen.value = true
}

const handleDeleteFolder = async (folder: FolderType) => {
  if (!confirm(`Are you sure you want to delete folder "${folder.name}" and its contents?`)) return
  try {
    await FolderService.deleteFolder(folder.id)
    folders.value = folders.value.filter((f) => f.id !== folder.id)

    if (currentUser.value && selectedEmployee.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'delete',
        actionTitle: 'Folder Deleted',
        description: `Deleted folder "${folder.name}" from ${selectedEmployee.value.name}'s workspace`,
        targetName: folder.name,
        employeeName: selectedEmployee.value.name,
      })
    }
  } catch (err: any) {
    alert(err.message || 'Failed to delete folder on server.')
  }
}

// Document Upload Actions
const handleUploadFiles = async (files: any[]) => {
  if (!selectedEmployee.value || !currentUser.value) return

  try {
    for (const file of files) {
      const uploaded = await DocumentService.uploadDocument({
        name: file.name,
        originalName: file.originalName || file.name,
        file: file.rawFile || file.file,
        mimeType: file.mimeType,
        size: file.size,
        folderId: currentFolderId.value,
        ownerId: selectedEmployee.value.id,
        uploadedBy: {
          id: currentUser.value.id,
          name: currentUser.value.name,
          role: currentUser.value.role,
        },
        textContent: file.textContent,
        docxHtml: file.docxHtml,
        pageCount: file.pageCount,
        assignedTo: [selectedEmployee.value.id],
      })

      documents.value.push(uploaded)

      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'upload',
        actionTitle: 'Document Uploaded',
        description: `Uploaded "${file.name}" to ${selectedEmployee.value.name}'s workspace`,
        targetName: file.name,
        targetId: uploaded.id,
        employeeName: selectedEmployee.value.name,
      })
    }
  } catch (err: any) {
    alert(err.message || 'Failed to upload document to server.')
  }
}

// Document Item Actions
const openDocumentPreview = (doc: DocumentType) => {
  activeDocumentForAction.value = doc
  isPreviewModalOpen.value = true
}

const openAssignModal = (doc: DocumentType) => {
  activeDocumentForAction.value = doc
  isAssignModalOpen.value = true
}

const handleAssignSaved = async (employeeIds: string[]) => {
  if (!activeDocumentForAction.value) return
  const updated = await AssignmentService.assignDocument(activeDocumentForAction.value.id, employeeIds)
  if (updated) {
    const idx = documents.value.findIndex((d) => d.id === updated.id)
    if (idx >= 0) documents.value[idx] = updated

    if (currentUser.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'assign',
        actionTitle: 'Document Assignments Updated',
        description: `Assigned "${updated.name}" to ${employeeIds.length} field employee(s)`,
        targetName: updated.name,
        targetId: updated.id,
      })
    }
  }
}

const openRenameDoc = (doc: DocumentType) => {
  activeItemForAction.value = doc
  activeItemType.value = 'document'
  isRenameModalOpen.value = true
}

const openMoveDoc = (doc: DocumentType) => {
  activeItemForAction.value = doc
  activeItemType.value = 'document'
  isMoveModalOpen.value = true
}

const handleRenameItem = async (newName: string) => {
  if (!activeItemForAction.value) return
  try {
    if (activeItemType.value === 'folder') {
      const updated = await FolderService.renameFolder(activeItemForAction.value.id, newName)
      if (updated) {
        const idx = folders.value.findIndex((f) => f.id === updated.id)
        if (idx >= 0) folders.value[idx] = updated
      }
    } else {
      const updated = await DocumentService.renameDocument(activeItemForAction.value.id, newName)
      if (updated) {
        const idx = documents.value.findIndex((d) => d.id === updated.id)
        if (idx >= 0) documents.value[idx] = updated
      }
    }
  } catch (err: any) {
    alert(err.message || 'Failed to rename item on server.')
  }
}

const handleMoveItem = async (targetFolderId: string | null) => {
  if (!activeItemForAction.value) return
  try {
    if (activeItemType.value === 'folder') {
      await FolderService.moveFolder(activeItemForAction.value.id, targetFolderId)
      folders.value = folders.value.filter((f) => f.id !== activeItemForAction.value?.id)
    } else {
      await DocumentService.moveDocument(activeItemForAction.value.id, targetFolderId)
      documents.value = documents.value.filter((d) => d.id !== activeItemForAction.value?.id)
    }
  } catch (err: any) {
    alert(err.message || 'Failed to move item on server.')
  }
}

const handleDeleteDoc = async (doc: DocumentType) => {
  if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return
  try {
    await DocumentService.deleteDocument(doc.id)
    documents.value = documents.value.filter((d) => d.id !== doc.id)

    if (currentUser.value && selectedEmployee.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'delete',
        actionTitle: 'Document Deleted',
        description: `Deleted "${doc.name}" from ${selectedEmployee.value.name}'s files`,
        targetName: doc.name,
        employeeName: selectedEmployee.value.name,
      })
    }
  } catch (err: any) {
    alert(err.message || 'Failed to delete document on server.')
  }
}

const handleDownload = (doc: DocumentType) => {
  if (doc.dataUrl) {
    const a = window.document.createElement('a')
    a.href = doc.dataUrl
    a.download = doc.originalName || doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    return
  }
  if (doc.previewUrl) {
    const a = window.document.createElement('a')
    a.href = doc.previewUrl
    a.download = doc.originalName || doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    return
  }
  const blob = new Blob([doc.textContent || doc.name], { type: doc.mimeType || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = doc.originalName || doc.name
  window.document.body.appendChild(a)
  a.click()
  window.document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- ACCESS DENIED STATE FOR NON-ADMINS -->
    <div
      v-if="!isAdmin"
      class="border rounded-xl p-8 sm:p-12 text-center space-y-4 bg-card max-w-lg mx-auto shadow-sm my-12"
    >
      <div class="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
        <AlertCircle class="size-6" />
      </div>
      <div>
        <h3 class="font-bold text-lg text-foreground">Admin Access Required</h3>
        <p class="text-xs sm:text-sm text-muted-foreground mt-1">
          The Field Manager view is restricted to system administrators. Please contact an administrator if you require access.
        </p>
      </div>
      <Button size="sm" class="text-xs" @click="router.push('/dashboard')">
        Return to Dashboard
      </Button>
    </div>

    <!-- VIEW 1: FIELD EMPLOYEES SELECTION DIRECTORY (When no employee is selected) -->
    <div v-else-if="!selectedEmployee" class="space-y-6">
      <!-- Header: Title, Description & Grid/List View Switcher -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UsersRound class="size-5" />
            </div>
            <span>Field Manager Directory</span>
          </h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage field personnel, inspect assigned folders, monitor workloads, and dispatch files.
          </p>
        </div>

        <!-- View Switcher Segmented Control -->        
        <div class="flex items-center gap-2 shrink-0">
          <div class="inline-flex items-center rounded-lg border bg-muted/50 p-1">
            <button
              type="button"
              :class="['p-1 rounded transition-colors', directoryViewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground']"
              title="Grid View"
              @click="setDirectoryViewMode('grid')"
            >
              <Grid class="size-3.5" />
            </button>
            <button
              type="button"
              :class="['p-1 rounded transition-colors', directoryViewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground']"
              title="List View"
              @click="setDirectoryViewMode('list')"
            >
              <ListIcon class="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Admin Summary Statistics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-card border rounded-xl p-4 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="text-xs font-medium">Total Employees</span>
            <UsersRound class="size-4 text-primary" />
          </div>
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {{ totalEmployeesCount }}
          </div>
          <p class="text-[11px] text-muted-foreground">Registered field personnel</p>
        </div>

        <div class="bg-card border rounded-xl p-4 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="text-xs font-medium">Active Personnel</span>
            <UserCheck class="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {{ activePersonnelCount }}
          </div>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for assignments</p>
        </div>

        <div class="bg-card border rounded-xl p-4 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="text-xs font-medium">Assigned Folders</span>
            <Folder class="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {{ totalAssignedFoldersCount }}
          </div>
          <p class="text-[11px] text-muted-foreground">Across all field personnel</p>
        </div>

        <div class="bg-card border rounded-xl p-4 shadow-2xs space-y-1">
          <div class="flex items-center justify-between text-muted-foreground">
            <span class="text-xs font-medium">High Workload</span>
            <TrendingUp class="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {{ highWorkloadCount }}
          </div>
          <p class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Personnel with 16+ folders</p>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border rounded-xl p-3 sm:p-4 shadow-2xs">
        <!-- Search Field -->
        <div class="relative flex-1 min-w-[240px]">
          <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            v-model="directorySearchQuery"
            placeholder="Search by name, username, ID, position, or department..."
            class="pl-9 h-9 text-xs"
          />
          <button
            v-if="directorySearchQuery"
            type="button"
            class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            @click="directorySearchQuery = ''"
          >
            <X class="size-4" />
          </button>
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status Filter -->
          <div class="flex items-center gap-1.5">
            <select
              v-model="statusFilter"
              class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <!-- Department Filter -->
          <div class="flex items-center gap-1.5">
            <select
              v-model="departmentFilter"
              class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground max-w-[170px] truncate"
            >
              <option value="all">All Departments</option>
              <option v-for="dept in availableDepartments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>

          <!-- Workload Filter -->
          <div class="flex items-center gap-1.5">
            <select
              v-model="workloadFilter"
              class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="all">All Workloads</option>
              <option value="none">No Folders (0)</option>
              <option value="low">Low Workload (1–5)</option>
              <option value="medium">Medium Workload (6–15)</option>
              <option value="high">High Workload (16+)</option>
            </select>
          </div>

          <!-- Sort Select -->
          <div class="flex items-center gap-1.5">
            <select
              v-model="directorySortBy"
              class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="name-asc">Sort: Name (A–Z)</option>
              <option value="name-desc">Sort: Name (Z–A)</option>
              <option value="folders-desc">Sort: Folders (High to Low)</option>
              <option value="folders-asc">Sort: Folders (Low to High)</option>
              <option value="status">Sort: Status</option>
              <option value="activity">Sort: Recent Activity</option>
            </select>
          </div>

          <!-- Reset Filters Button -->
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            class="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
            @click="resetFilters"
          >
            <X class="size-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      <!-- EMPTY STATE: NO EMPLOYEES MATCH SEARCH / FILTERS -->
      <div
        v-if="filteredEmployees.length === 0"
        class="border-2 border-dashed rounded-xl p-12 text-center space-y-3 bg-muted/10"
      >
        <div class="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UsersRound class="size-6" />
        </div>
        <div>
          <h4 class="font-semibold text-sm text-foreground">No field personnel found</h4>
          <p class="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
            <span v-if="directorySearchQuery">
              No employees match the query "{{ directorySearchQuery }}".
            </span>
            <span v-else>
              No employees match the selected filter criteria.
            </span>
          </p>
        </div>
        <Button size="sm" variant="outline" class="text-xs mt-2" @click="resetFilters">
          Clear Filters &amp; Search
        </Button>
      </div>

      <!-- GRID VIEW -->
      <div
        v-else-if="directoryViewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
      >
        <Card
          v-for="emp in paginatedEmployees"
          :key="emp.id"
          class="shadow-2xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden border"
        >
          <!-- Card Header -->
          <CardHeader class="pb-1 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <Avatar class="size-10 border shrink-0 group-hover:border-primary/50 transition-colors">
                  <AvatarFallback class="bg-primary/10 text-primary font-bold text-xs">
                    {{ emp.name ? emp.name.split(' ').map((n) => n[0]).join('') : 'U' }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <div class="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {{ emp.name }}
                  </div>
                  <div class="text-[11px] text-muted-foreground truncate">
                    {{ emp.position }}
                  </div>
                </div>
              </div>

              <!-- Status Badge with Dot -->
              <Badge
                variant="outline"
                :class="['text-[10px] capitalize gap-1 font-medium shrink-0 px-2 py-0.5', getStatusBadgeClass(getEmployeeStatus(emp))]"
              >
                <span class="size-1.5 rounded-full" :class="getStatusDotClass(getEmployeeStatus(emp))" />
                {{ getEmployeeStatus(emp) }}
              </Badge>
            </div>

            <!-- Department & ID Row -->
            <div class="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed">
              <span class="font-mono text-[10px] text-muted-foreground/80">ID: {{ emp.id }}</span>
            </div>
          </CardHeader>

          <!-- Card Content: Workload & Assigned Folders Preview -->
          <CardContent class="pt-0 space-y-3 flex-1 flex flex-col justify-between">
            <div class="space-y-2">
              <!-- Folder Count Workload Indicator -->
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-medium text-muted-foreground">Assigned Folders:</span>
                <Badge variant="outline">
                  <FolderOpen class="w-3.5 h-3.5 mr-1" /> {{ getEmployeeFolders(emp.id).length }}
                </Badge>
              </div>

              <!-- Folders Preview (Max 3 folders, or +X more) -->
              <div class="bg-muted/30 border rounded-lg p-2.5 space-y-1.5 text-xs">
                <!-- If 0 folders -->
                <div
                  v-if="getEmployeeFolders(emp.id).length === 0"
                  class="text-center py-2 space-y-1.5"
                >
                  <p class="text-[11px] text-muted-foreground">No folders assigned yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 text-[11px] gap-1 w-full"
                    @click="openAssignFolderModal(emp)"
                  >
                    <FolderPlus class="size-3" />
                    <span>Assign Folder</span>
                  </Button>
                </div>

                <!-- If has folders: list up to 3 folders -->
                <div v-else class="space-y-1">
                  <div
                    v-for="folder in getEmployeeFolders(emp.id).slice(0, 3)"
                    :key="folder.id"
                    class="flex items-center gap-1.5 py-0.5 text-xs group/item cursor-pointer"
                    title="Open workspace to view folder"
                    @click="openEmployeeWorkspace(emp)"
                  >
                    <Folder class="size-3 text-primary shrink-0" />
                    <span class="truncate text-foreground group-hover/item:text-primary transition-colors">
                      {{ folder.name }}
                    </span>
                  </div>

                  <!-- "+X more" link if more than 3 folders -->
                  <button
                    v-if="getEmployeeFolders(emp.id).length > 3"
                    type="button"
                    class="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5 pt-1 cursor-pointer"
                    @click="openEmployeeWorkspace(emp)"
                  >
                    <span>+{{ getEmployeeFolders(emp.id).length - 3 }} more folders</span>
                    <ChevronRight class="size-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="flex items-center gap-2 pt-2 border-t mt-auto">
              <Button
                variant="outline"
                size="sm"
                class="flex-1 text-xs h-8 gap-1.5 group-hover:border-primary group-hover:text-primary transition-colors"
                @click="openEmployeeWorkspace(emp)"
              >
                <FolderOpen class="size-3.5" />
                <span>View Folders</span>
                <ChevronRight class="size-3 ml-auto opacity-70" />
              </Button>

              <!-- <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground hover:text-primary"
                title="Assign new folder"
                @click="openAssignFolderModal(emp)"
              >
                <FolderPlus class="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8 text-muted-foreground">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44 text-xs">
                  <DropdownMenuItem class="cursor-pointer gap-2" @click="openEmployeeWorkspace(emp)">
                    <FolderOpen class="size-3.5" /> View Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem class="cursor-pointer gap-2" @click="openAssignFolderModal(emp)">
                    <FolderPlus class="size-3.5" /> Assign Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="cursor-pointer gap-2" @click="copyEmployeeId(emp.id)">
                    <Copy class="size-3.5" /> Copy Employee ID
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> -->
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- LIST VIEW -->
      <div
        v-else-if="directoryViewMode === 'list'"
        class="border rounded-xl bg-card overflow-hidden shadow-2xs"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[280px]">Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead class="text-center">Assigned Folders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="emp in paginatedEmployees"
              :key="emp.id"
              class="cursor-pointer group hover:bg-muted/40 transition-colors"
              @click="openEmployeeWorkspace(emp)"
            >
              <!-- Employee Column (Avatar + Name + ID) -->
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar class="size-9 border group-hover:border-primary transition-colors shrink-0">
                    <AvatarFallback class="bg-primary/10 text-primary text-xs font-bold">
                      {{ emp.name ? emp.name.split(' ').map((n) => n[0]).join('') : 'U' }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <div class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {{ emp.name }}
                    </div>
                    <div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span>{{ emp.username || emp.id }}</span>
                    </div>
                  </div>
                </div>
              </TableCell>

              <!-- Position -->
              <TableCell class="font-medium text-foreground">
                {{ emp.position }}
              </TableCell>

              <!-- Department -->
              <TableCell>
                <Badge variant="outline" class="font-normal text-xs text-muted-foreground bg-muted/40">
                  {{ emp.department || 'Field Ops' }}
                </Badge>
              </TableCell>

              <!-- Assigned Folders & Workload Badge -->
              <TableCell class="text-center">
                <Badge
                  :class="[
                    'text-xs font-semibold px-2.5 py-0.5 border',
                    getWorkloadClass(getEmployeeFolders(emp.id).length),
                  ]"
                >
                  📁 {{ getEmployeeFolders(emp.id).length }}
                </Badge>
              </TableCell>

              <!-- Status -->
              <TableCell>
                <Badge
                  variant="outline"
                  :class="[
                    'text-[11px] capitalize gap-1 font-medium px-2 py-0.5',
                    getStatusBadgeClass(getEmployeeStatus(emp)),
                  ]"
                >
                  <span class="size-1.5 rounded-full" :class="getStatusDotClass(getEmployeeStatus(emp))" />
                  {{ getEmployeeStatus(emp) }}
                </Badge>
              </TableCell>

              <!-- Last Activity -->
              <TableCell class="text-muted-foreground text-xs">
                {{ getEmployeeLastActivity(emp) }}
              </TableCell>

              <!-- Row Actions -->
              <TableCell class="text-right" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-8 text-xs gap-1 hover:border-primary hover:text-primary"
                    title="Open Workspace"
                    @click="openEmployeeWorkspace(emp)"
                  >
                    <FolderOpen class="size-3.5" />
                    <span class="hidden sm:inline">View Folders</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="size-8 text-muted-foreground hover:text-primary"
                    title="Assign Folder"
                    @click="openAssignFolderModal(emp)"
                  >
                    <FolderPlus class="size-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button size="icon" variant="ghost" class="size-8">
                        <MoreHorizontal class="size-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-44 text-xs">
                      <DropdownMenuItem class="cursor-pointer gap-2" @click="openEmployeeWorkspace(emp)">
                        <FolderOpen class="size-3.5" /> View Workspace
                      </DropdownMenuItem>
                      <DropdownMenuItem class="cursor-pointer gap-2" @click="openAssignFolderModal(emp)">
                        <FolderPlus class="size-3.5" /> Assign Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="cursor-pointer gap-2" @click="copyEmployeeId(emp.id)">
                        <Copy class="size-3.5" /> Copy ID: {{ emp.id }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- PAGINATION CONTROLS -->
      <div
        v-if="filteredEmployees.length > itemsPerPage"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t"
      >
        <div>
          Showing <span class="font-medium text-foreground">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
          to <span class="font-medium text-foreground">{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }}</span>
          of <span class="font-medium text-foreground">{{ filteredEmployees.length }}</span> field personnel
        </div>
        <div class="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            class="h-8 px-2.5 text-xs gap-1"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft class="size-3.5" />
            <span>Previous</span>
          </Button>
          <div class="px-2.5 font-medium text-foreground text-xs">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          <Button
            size="sm"
            variant="outline"
            class="h-8 px-2.5 text-xs gap-1"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <span>Next</span>
            <ChevronRight class="size-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- VIEW 2: EMPLOYEE FILE WORKSPACE (When employee is selected) -->
    <div v-else class="space-y-5">
      <!-- Selected Employee Header Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-4 sm:p-5 shadow-xs">
        <div class="flex items-center gap-3.5">
          <Button
            variant="ghost"
            size="icon"
            class="size-8 shrink-0"
            title="Back to all employees"
            @click="backToEmployeeList"
          >
            <ArrowLeft class="size-4" />
          </Button>

          <Avatar class="size-11 border-2 border-primary/30 shrink-0">
            <AvatarFallback class="bg-primary/10 text-primary font-bold text-sm">
              {{ selectedEmployee.name.split(' ').map((n) => n[0]).join('') }}
            </AvatarFallback>
          </Avatar>

          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-base sm:text-lg text-foreground leading-tight">
                {{ selectedEmployee.name }}'s Workspace
              </h2>
              <Badge variant="secondary" class="text-[10px] hidden sm:inline-flex">
                {{ selectedEmployee.position }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5">
              Project: <span class="font-medium text-foreground">{{ selectedEmployee.assignedProject || 'Naga Project' }}</span>
              &bull; {{ selectedEmployee.department }}
            </p>
          </div>
        </div>

        <!-- Quick Switch or Switch Employee -->
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 text-xs self-start md:self-auto"
          @click="backToEmployeeList"
        >
          <UsersRound class="size-3.5" />
          <span>Switch Employee</span>
        </Button>
      </div>

      <!-- Breadcrumbs Bar -->
      <div class="flex items-center justify-between gap-2 border-b pb-3 text-xs">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                class="cursor-pointer hover:text-foreground"
                @click="backToEmployeeList"
              >
                Field Manager
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                class="cursor-pointer hover:text-foreground font-medium"
                :class="!currentFolderId ? 'text-foreground font-semibold' : ''"
                @click="goToEmployeeRoot"
              >
                {{ selectedEmployee.name }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <template v-for="crumb in breadcrumbs" :key="crumb.id || crumb.path">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  class="cursor-pointer hover:text-foreground font-medium"
                  :class="currentFolderId === crumb.id ? 'text-foreground font-semibold' : ''"
                  @click="router.push(crumb.path)"
                >
                  {{ crumb.label }}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          v-if="currentFolderId"
          variant="ghost"
          size="sm"
          class="h-7 text-xs gap-1"
          @click="navigateUp"
        >
          <ArrowLeft class="size-3" />
          <span>Up One Level</span>
        </Button>
      </div>

      <!-- File Manager Action Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
        <!-- Primary Creation Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Upload Button -->
          <Button
            size="sm"
            class="gap-1.5 text-xs shadow-xs"
            @click="isUploadModalOpen = true"
          >
            <Upload class="size-3.5" />
            <span>Upload Files</span>
          </Button>

          <!-- New Folder Button -->
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs"
            @click="isNewFolderModalOpen = true"
          >
            <FolderPlus class="size-3.5 text-primary" />
            <span>New Folder</span>
          </Button>
        </div>

        <!-- Search & View Filters -->
        <div class="flex items-center gap-2">
          <div class="relative w-full sm:w-48">
            <Search class="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Search files..."
              class="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <!-- View Mode Toggle -->
          <div class="flex items-center border rounded-md bg-background p-0.5">
            <button
              type="button"
              :class="['p-1 rounded transition-colors', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground']"
              title="Grid View"
              @click="viewMode = 'grid'"
            >
              <Grid class="size-3.5" />
            </button>
            <button
              type="button"
              :class="['p-1 rounded transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground']"
              title="List View"
              @click="viewMode = 'list'"
            >
              <ListIcon class="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- SECTION 1: FOLDERS -->
      <div v-if="filteredFolders.length > 0" class="space-y-2.5">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders ({{ filteredFolders.length }})
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="folder in filteredFolders"
            :key="folder.id"
            class="group flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all cursor-pointer shadow-2xs"
            @click="openFolder(folder)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="size-8 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
                :style="{ backgroundColor: `${folder.color || '#2563eb'}15`, color: folder.color || '#2563eb' }"
              >
                <Folder class="size-4 fill-current" />
              </div>
              <div class="min-w-0">
                <span class="text-xs font-semibold truncate block text-foreground group-hover:text-primary">
                  {{ folder.name }}
                </span>
                <span class="text-[10px] text-muted-foreground">Folder</span>
              </div>
            </div>

            <!-- Folder Context Menu -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child @click.stop>
                <Button variant="ghost" size="icon" class="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical class="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-40 text-xs">
                <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openRenameFolder(folder)">
                  <Edit2 class="size-3.5" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openMoveFolder(folder)">
                  <FolderSymlink class="size-3.5" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="cursor-pointer text-destructive gap-2" @click.stop="handleDeleteFolder(folder)">
                  <Trash2 class="size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <!-- SECTION 2: DOCUMENTS -->
      <div class="space-y-2.5 pt-2">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documents ({{ filteredDocuments.length }})
          </h3>
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredFolders.length === 0 && filteredDocuments.length === 0"
          class="border-2 border-dashed rounded-xl p-12 text-center space-y-3 bg-muted/10"
        >
          <div class="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <FolderOpen class="size-6" />
          </div>
          <div>
            <h4 class="font-semibold text-sm">No files in this folder yet</h4>
            <p class="text-xs text-muted-foreground mt-0.5">
              Upload documents or create subfolders for {{ selectedEmployee.name }}.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" class="gap-1.5 text-xs" @click="isUploadModalOpen = true">
              <Upload class="size-3.5" /> Upload File
            </Button>
            <Button size="sm" variant="outline" class="gap-1.5 text-xs" @click="isNewFolderModalOpen = true">
              <FolderPlus class="size-3.5" /> New Folder
            </Button>
          </div>
        </div>

        <!-- GRID VIEW -->
        <div
          v-else-if="viewMode === 'grid'"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
        >
          <Card
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="group shadow-2xs hover:border-primary/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
            @click="openDocumentPreview(doc)"
          >
            <!-- Card Thumbnail / Preview Banner -->
            <div class="h-28 bg-muted/40 border-b flex items-center justify-center relative overflow-hidden">
              <img
                v-if="doc.type === 'image' && (doc.previewUrl || doc.thumbnailUrl)"
                :src="doc.previewUrl || doc.thumbnailUrl"
                :alt="doc.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div v-else class="flex flex-col items-center gap-1 text-muted-foreground">
                <FileText v-if="doc.type === 'pdf'" class="size-10 text-red-500" />
                <FileText v-else class="size-10 text-primary" />
                <span class="text-[10px] font-mono uppercase tracking-wider font-semibold">
                  {{ doc.type }}
                </span>
              </div>

              <!-- Badges on Thumbnail -->
              <div class="absolute top-2 left-2 flex items-center gap-1">
                <Badge
                  v-if="doc.offlineCached"
                  variant="success"
                  class="text-[9px] px-1.5 py-0 shadow-xs"
                >
                  Offline ✓
                </Badge>
              </div>

              <div class="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child @click.stop>
                    <Button variant="secondary" size="icon" class="size-6 bg-background/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical class="size-3 text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40 text-xs">
                    <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openDocumentPreview(doc)">
                      <Eye class="size-3.5" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openAssignModal(doc)">
                      <UserCheck class="size-3.5" /> Assign To...
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="handleDownload(doc)">
                      <Download class="size-3.5" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openRenameDoc(doc)">
                      <Edit2 class="size-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2" @click.stop="openMoveDoc(doc)">
                      <FolderSymlink class="size-3.5" /> Move
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="cursor-pointer text-destructive gap-2" @click.stop="handleDeleteDoc(doc)">
                      <Trash2 class="size-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <!-- Card Info -->
            <CardContent class="p-3 space-y-1.5">
              <div class="flex items-start justify-between gap-1">
                <h4 class="text-xs font-bold leading-snug truncate text-foreground group-hover:text-primary transition-colors">
                  {{ doc.name }}
                </h4>
              </div>
              <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{{ doc.sizeFormatted }}</span>
                <span>{{ new Date(doc.createdAt).toLocaleDateString() }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- LIST VIEW -->
        <div v-else class="border rounded-lg overflow-hidden bg-card">
          <div class="grid grid-cols-12 px-4 py-2.5 bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase">
            <span class="col-span-6">Name</span>
            <span class="col-span-2">Size</span>
            <span class="col-span-2">Date Added</span>
            <span class="col-span-2 text-right">Actions</span>
          </div>

          <div class="divide-y text-xs">
            <div
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="grid grid-cols-12 px-4 py-3 items-center hover:bg-accent/40 transition-colors cursor-pointer"
              @click="openDocumentPreview(doc)"
            >
              <div class="col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                <FileText v-if="doc.type === 'pdf'" class="size-4 text-red-500 shrink-0" />
                <ImageIcon v-else-if="doc.type === 'image'" class="size-4 text-blue-500 shrink-0" />
                <FileText v-else class="size-4 text-primary shrink-0" />
                <span class="font-medium truncate text-foreground">{{ doc.name }}</span>
                <Badge v-if="doc.offlineCached" variant="success" class="text-[9px] px-1 py-0 shrink-0">
                  Offline
                </Badge>
              </div>

              <span class="col-span-2 text-muted-foreground">{{ doc.sizeFormatted }}</span>
              <span class="col-span-2 text-muted-foreground">{{ new Date(doc.createdAt).toLocaleDateString() }}</span>

              <div class="col-span-2 flex items-center justify-end gap-1" @click.stop>
                <Button variant="ghost" size="icon" class="size-7" title="Preview" @click="openDocumentPreview(doc)">
                  <Eye class="size-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" class="size-7" title="Assign" @click="openAssignModal(doc)">
                  <UserCheck class="size-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" class="size-7" title="Download" @click="handleDownload(doc)">
                  <Download class="size-3.5 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="size-7">
                      <MoreVertical class="size-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-36 text-xs">
                    <DropdownMenuItem class="cursor-pointer gap-2" @click="openRenameDoc(doc)">
                      <Edit2 class="size-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2" @click="openMoveDoc(doc)">
                      <FolderSymlink class="size-3.5" /> Move
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="cursor-pointer text-destructive gap-2" @click="handleDeleteDoc(doc)">
                      <Trash2 class="size-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <NewFolderModal
      :is-open="isNewFolderModalOpen"
      :owner-name="selectedEmployee?.name || targetEmployeeForNewFolder?.name"
      :parent-folder-name="currentFolder?.name"
      @close="isNewFolderModalOpen = false; targetEmployeeForNewFolder = null"
      @create="handleCreateFolder"
    />

    <UploadFilesModal
      :is-open="isUploadModalOpen"
      :owner-name="selectedEmployee?.name"
      :target-path-name="currentFolder?.name"
      @close="isUploadModalOpen = false"
      @upload="handleUploadFiles"
    />

    <AssignDocumentModal
      :is-open="isAssignModalOpen"
      :document="activeDocumentForAction"
      @close="isAssignModalOpen = false"
      @assigned="handleAssignSaved"
    />

    <RenameItemModal
      :is-open="isRenameModalOpen"
      :current-name="activeItemForAction?.name || ''"
      :item-type="activeItemType"
      @close="isRenameModalOpen = false"
      @rename="handleRenameItem"
    />

    <MoveItemModal
      :is-open="isMoveModalOpen"
      :item="activeItemForAction"
      :item-type="activeItemType"
      :owner-id="selectedEmployee?.id || ''"
      @close="isMoveModalOpen = false"
      @move="handleMoveItem"
    />

    <DocumentPreviewModal
      :is-open="isPreviewModalOpen"
      :document="activeDocumentForAction"
      @close="isPreviewModalOpen = false"
      @open-assign="(doc) => { isPreviewModalOpen = false; openAssignModal(doc); }"
      @updated="(updatedDoc) => {
        const idx = documents.findIndex((d) => d.id === updatedDoc.id);
        if (idx >= 0) documents[idx] = updatedDoc;
      }"
    />
  </div>
</template>
