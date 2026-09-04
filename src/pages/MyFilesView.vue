<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FolderTree,
  Folder,
  FileText,
  Image as ImageIcon,
  Upload,
  FolderPlus,
  Eye,
  Download,
  Search,
  Grid,
  List as ListIcon,
  ArrowLeft,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import DocumentPreviewModal from '@/components/modals/DocumentPreviewModal.vue'
import UploadFilesModal from '@/components/modals/UploadFilesModal.vue'
import NewFolderModal from '@/components/modals/NewFolderModal.vue'

import { DocumentService } from '@/services/DocumentService'
import { FolderService } from '@/services/FolderService'
import { useAuth } from '@/composables/useAuth'
import type { Folder as FolderType, Document as DocumentType, BreadcrumbCrumb } from '@/types'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()

const currentFolderId = ref<string | null>(null)
const currentFolder = ref<FolderType | null>(null)
const folders = ref<FolderType[]>([])
const documents = ref<DocumentType[]>([])
const breadcrumbs = ref<BreadcrumbCrumb[]>([])

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const filterOfflineOnly = ref(false)
const isLoading = ref(true)

// Modals
const isPreviewModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isNewFolderModalOpen = ref(false)
const activeDocument = ref<DocumentType | null>(null)

const loadEmployeeFiles = async () => {
  if (!currentUser.value) return
  isLoading.value = true

  const folderId = (route.params.folderId as string | undefined) || null
  currentFolderId.value = folderId

  try {
    if (folderId) {
      currentFolder.value = await FolderService.getFolderById(folderId)
    } else {
      currentFolder.value = null
    }

    // Load folders in current path
    folders.value = await FolderService.getChildFolders(folderId, currentUser.value.id)

    // Load documents in current folder
    const allAssigned = await DocumentService.getAssignedDocumentsForEmployee(currentUser.value.id)
    documents.value = allAssigned.filter((d) => (folderId ? d.folderId === folderId : d.folderId === null))

    breadcrumbs.value = await FolderService.getFolderPath(folderId, currentUser.value.id, '/my-files')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEmployeeFiles)

watch(
  () => [route.params.folderId, currentUser.value?.id],
  async () => {
    await loadEmployeeFiles()
  },
)

const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return folders.value
  const q = searchQuery.value.toLowerCase().trim()
  return folders.value.filter((f) => f.name.toLowerCase().includes(q))
})

const filteredDocuments = computed(() => {
  let list = documents.value
  if (filterOfflineOnly.value) {
    list = list.filter((d) => d.offlineCached)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((d) => d.name.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q)))
  }
  return list
})

const openFolder = (folder: FolderType) => {
  router.push(`/my-files/${folder.id}`)
}

const navigateUp = () => {
  if (currentFolder.value?.parentId) {
    router.push(`/my-files/${currentFolder.value.parentId}`)
  } else {
    router.push('/my-files')
  }
}

const openDocPreview = (doc: DocumentType) => {
  activeDocument.value = doc
  isPreviewModalOpen.value = true
}

const handleUploadFiles = async (files: any[]) => {
  if (!currentUser.value) return
  for (const file of files) {
    const uploaded = await DocumentService.uploadDocument({
      name: file.name,
      originalName: file.originalName || file.name,
      mimeType: file.mimeType,
      size: file.size,
      folderId: currentFolderId.value,
      ownerId: currentUser.value.id,
      uploadedBy: {
        id: currentUser.value.id,
        name: currentUser.value.name,
        role: currentUser.value.role,
      },
      previewUrl: file.previewUrl,
      thumbnailUrl: file.thumbnailUrl,
      textContent: file.textContent,
      docxHtml: file.docxHtml,
      dataUrl: file.dataUrl,
      pageCount: file.pageCount,
      assignedTo: [currentUser.value.id],
    })
    documents.value.push(uploaded)
  }
}

const handleCreateFolder = async (data: { name: string; color: string }) => {
  if (!currentUser.value) return
  const newFolder = await FolderService.createFolder({
    name: data.name,
    parentId: currentFolderId.value,
    ownerId: currentUser.value.id,
    color: data.color,
  })
  folders.value.push(newFolder)
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
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-5 shadow-xs">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FolderTree class="size-6 text-primary" />
          My Field Files
        </h1>
        <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Access documents, permits, project drawings, and photos assigned to you.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <Button size="sm" class="gap-1.5 text-xs shadow-xs" @click="isUploadModalOpen = true">
          <Upload class="size-3.5" />
          <span>Upload Field Photo/File</span>
        </Button>
        <Button variant="outline" size="sm" class="gap-1.5 text-xs" @click="isNewFolderModalOpen = true">
          <FolderPlus class="size-3.5 text-primary" />
          <span>New Folder</span>
        </Button>
      </div>
    </div>

    <!-- Breadcrumbs Bar -->
    <div class="flex items-center justify-between gap-2 border-b pb-3 text-xs">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              class="cursor-pointer hover:text-foreground font-medium"
              :class="!currentFolderId ? 'text-foreground font-semibold' : ''"
              @click="router.push('/my-files')"
            >
              My Files Root
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

    <!-- Toolbar Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
      <!-- Search -->
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search assigned files..."
          class="pl-8 h-8 text-xs bg-background"
        />
      </div>

      <!-- Offline Filter & View Switch -->
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          :variant="filterOfflineOnly ? 'default' : 'outline'"
          class="h-8 text-xs gap-1.5"
          @click="filterOfflineOnly = !filterOfflineOnly"
        >
          <CheckCircle2 class="size-3.5 text-emerald-500" />
          <span>Offline Available Only</span>
        </Button>

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

    <!-- Folders Section -->
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
            <span class="text-xs font-semibold truncate block text-foreground group-hover:text-primary">
              {{ folder.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Documents Section -->
    <div class="space-y-2.5 pt-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Assigned Documents ({{ filteredDocuments.length }})
      </h3>

      <!-- Empty State -->
      <div
        v-if="filteredFolders.length === 0 && filteredDocuments.length === 0"
        class="border-2 border-dashed rounded-xl p-12 text-center space-y-3 bg-muted/10"
      >
        <div class="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <FolderTree class="size-6" />
        </div>
        <div>
          <h4 class="font-semibold text-sm">No files in this folder</h4>
          <p class="text-xs text-muted-foreground mt-0.5">
            Your office administrator has not assigned files to this directory yet.
          </p>
        </div>
        <Button size="sm" class="gap-1.5 text-xs mt-2" @click="isUploadModalOpen = true">
          <Upload class="size-3.5" /> Upload File
        </Button>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
      >
        <Card
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="group shadow-2xs hover:border-primary/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          @click="openDocPreview(doc)"
        >
          <!-- Card Thumbnail -->
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

            <!-- Offline badge -->
            <div class="absolute top-2 left-2 flex items-center gap-1">
              <Badge
                v-if="doc.offlineCached"
                variant="success"
                class="text-[9px] px-1.5 py-0 shadow-xs"
              >
                Offline ✓
              </Badge>
            </div>
          </div>

          <!-- Card Content -->
          <CardContent class="p-3 space-y-1.5">
            <h4 class="text-xs font-bold leading-snug truncate text-foreground group-hover:text-primary transition-colors">
              {{ doc.name }}
            </h4>
            <div class="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{{ doc.sizeFormatted }}</span>
              <span>{{ new Date(doc.createdAt).toLocaleDateString() }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- List View -->
      <div v-else class="border rounded-lg overflow-hidden bg-card">
        <div class="grid grid-cols-12 px-4 py-2.5 bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase">
          <span class="col-span-6">Name</span>
          <span class="col-span-2">Size</span>
          <span class="col-span-2">Date Added</span>
          <span class="col-span-2 text-right">Action</span>
        </div>

        <div class="divide-y text-xs">
          <div
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="grid grid-cols-12 px-4 py-3 items-center hover:bg-accent/40 transition-colors cursor-pointer"
            @click="openDocPreview(doc)"
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
              <Button variant="ghost" size="icon" class="size-7" title="Preview" @click="openDocPreview(doc)">
                <Eye class="size-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" class="size-7" title="Download" @click="handleDownload(doc)">
                <Download class="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <DocumentPreviewModal
      :is-open="isPreviewModalOpen"
      :document="activeDocument"
      @close="isPreviewModalOpen = false"
      @updated="(updatedDoc) => {
        const idx = documents.findIndex((d) => d.id === updatedDoc.id);
        if (idx >= 0) documents[idx] = updatedDoc;
      }"
    />

    <UploadFilesModal
      :is-open="isUploadModalOpen"
      :owner-name="currentUser?.name"
      :target-path-name="currentFolder?.name"
      @close="isUploadModalOpen = false"
      @upload="handleUploadFiles"
    />

    <NewFolderModal
      :is-open="isNewFolderModalOpen"
      :owner-name="currentUser?.name"
      :parent-folder-name="currentFolder?.name"
      @close="isNewFolderModalOpen = false"
      @create="handleCreateFolder"
    />
  </div>
</template>
