<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UsersRound,
  FolderPlus,
  Upload,
  Folder,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  ChevronRight,
  Search,
  Grid,
  List as ListIcon,
  ArrowLeft,
  Trash2,
  Edit2,
  FolderSymlink,
  Download,
  Eye,
  UserCheck,
  FolderOpen,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
const { currentUser } = useAuth()

// State
const employees = ref<User[]>([])
const selectedEmployee = ref<User | null>(null)
const currentFolderId = ref<string | null>(null)
const currentFolder = ref<FolderType | null>(null)

const folders = ref<FolderType[]>([])
const documents = ref<DocumentType[]>([])
const breadcrumbs = ref<BreadcrumbCrumb[]>([])

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'name' | 'date' | 'size'>('name')
const isLoading = ref(true)

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
  employees.value = await UserService.getFieldEmployees()
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

// Computed list filters
const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return folders.value
  const q = searchQuery.value.toLowerCase().trim()
  return folders.value.filter((f) => f.name.toLowerCase().includes(q))
})

const filteredDocuments = computed(() => {
  let list = documents.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((d) => d.name.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q)))
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

const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) return employees.value
  const q = searchQuery.value.toLowerCase().trim()
  return employees.value.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.assignedProject?.toLowerCase().includes(q),
  )
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

// Folder Actions
const handleCreateFolder = async (data: { name: string; color: string }) => {
  if (!selectedEmployee.value) return
  try {
    const newFolder = await FolderService.createFolder({
      name: data.name,
      parentId: currentFolderId.value,
      ownerId: selectedEmployee.value.id,
      color: data.color,
    })

    folders.value.push(newFolder)

    if (currentUser.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'create_folder',
        actionTitle: 'Folder Created',
        description: `Created folder "${data.name}" for ${selectedEmployee.value.name}`,
        targetName: data.name,
        targetId: newFolder.id,
        employeeName: selectedEmployee.value.name,
      })
    }
  } catch (err: any) {
    alert(err.message || 'Failed to create folder on server.')
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
    <!-- VIEW 1: FIELD EMPLOYEES SELECTION DIRECTORY (When no employee is selected) -->
    <div v-if="!selectedEmployee" class="space-y-6">
      <!-- Title & Search Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UsersRound class="size-6 text-primary" />
            Field Manager Directory
          </h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Select a field employee to manage their assigned folders and upload digital files.
          </p>
        </div>

        <!-- Search box -->
        <div class="relative w-full sm:w-72">
          <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search field personnel or project..."
            class="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <!-- Empty State if no employees match search -->
      <div
        v-if="filteredEmployees.length === 0"
        class="border-2 border-dashed rounded-xl p-12 text-center space-y-3 bg-muted/10"
      >
        <div class="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UsersRound class="size-6" />
        </div>
        <div>
          <h4 class="font-semibold text-sm">No field personnel found</h4>
          <p class="text-xs text-muted-foreground mt-0.5">
            No employees match the filter criteria "{{ searchQuery }}".
          </p>
        </div>
        <Button size="sm" variant="outline" class="text-xs mt-2" @click="searchQuery = ''">
          Clear Search Filter
        </Button>
      </div>

      <!-- Employee Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="emp in filteredEmployees"
          :key="emp.id"
          class="shadow-xs hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          @click="openEmployeeWorkspace(emp)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-center gap-3">
              <Avatar class="size-11 border-2 border-primary/20 group-hover:border-primary transition-colors">
                <AvatarFallback class="bg-primary/10 text-primary font-bold text-sm">
                  {{ emp.name.split(' ').map((n) => n[0]).join('') }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <CardTitle class="text-base font-bold group-hover:text-primary transition-colors truncate">
                  {{ emp.name }}
                </CardTitle>
                <CardDescription class="text-xs font-medium text-muted-foreground truncate">
                  {{ emp.position }}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="pt-0 space-y-4">
            <div class="bg-muted/40 p-2.5 rounded-lg text-xs space-y-1 border">
              <div class="flex items-center justify-between text-muted-foreground">
                <span>Assigned Project:</span>
                <span class="font-semibold text-foreground truncate max-w-[150px]">
                  {{ emp.assignedProject || 'Naga Project' }}
                </span>
              </div>
              <div class="flex items-center justify-between text-muted-foreground">
                <span>Department:</span>
                <span class="font-medium text-foreground">{{ emp.department }}</span>
              </div>
            </div>

            <!-- Workspace Action Button -->
            <Button variant="outline" class="w-full gap-2 text-xs h-9 group-hover:border-primary group-hover:text-primary transition-colors">
              <FolderOpen class="size-3.5" />
              <span>Open Employee Workspace</span>
              <ChevronRight class="size-3.5 ml-auto" />
            </Button>
          </CardContent>
        </Card>
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
      :owner-name="selectedEmployee?.name"
      :parent-folder-name="currentFolder?.name"
      @close="isNewFolderModalOpen = false"
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
