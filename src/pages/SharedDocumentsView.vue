<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FolderSync,
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
const { currentUser, isAdmin } = useAuth()

const currentFolderId = ref<string | null>(null)
const currentFolder = ref<FolderType | null>(null)
const folders = ref<FolderType[]>([])
const documents = ref<DocumentType[]>([])
const breadcrumbs = ref<BreadcrumbCrumb[]>([])

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const isLoading = ref(true)

const isPreviewModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isNewFolderModalOpen = ref(false)
const activeDocument = ref<DocumentType | null>(null)

const loadSharedFiles = async () => {
  isLoading.value = true
  const folderId = (route.params.folderId as string | undefined) || null
  currentFolderId.value = folderId

  try {
    if (folderId) {
      currentFolder.value = await FolderService.getFolderById(folderId)
    } else {
      currentFolder.value = null
    }

    folders.value = await FolderService.getChildFolders(folderId, 'shared')
    const allDocs = await DocumentService.getDocumentsByFolder(folderId, 'shared')
    documents.value = allDocs

    breadcrumbs.value = await FolderService.getFolderPath(folderId, 'shared', '/shared-documents')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSharedFiles)

watch(
  () => route.params.folderId,
  async () => {
    await loadSharedFiles()
  },
)

const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return folders.value
  const q = searchQuery.value.toLowerCase().trim()
  return folders.value.filter((f) => f.name.toLowerCase().includes(q))
})

const filteredDocuments = computed(() => {
  if (!searchQuery.value.trim()) return documents.value
  const q = searchQuery.value.toLowerCase().trim()
  return documents.value.filter((d) => d.name.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q)))
})

const openFolder = (folder: FolderType) => {
  router.push(`/shared-documents/${folder.id}`)
}

const navigateUp = () => {
  if (currentFolder.value?.parentId) {
    router.push(`/shared-documents/${currentFolder.value.parentId}`)
  } else {
    router.push('/shared-documents')
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
      originalName: file.name,
      file: file.file,
      mimeType: file.mimeType,
      size: file.size,
      folderId: currentFolderId.value,
      ownerId: 'shared',
      uploadedBy: {
        id: currentUser.value.id,
        name: currentUser.value.name,
        role: currentUser.value.role,
      },
      previewUrl: file.previewUrl,
      assignedTo: [],
    })
    documents.value.push(uploaded)
  }
}

const handleCreateFolder = async (data: { name: string; color: string }) => {
  if (!currentUser.value) return
  const newFolder = await FolderService.createFolder({
    name: data.name,
    parentId: currentFolderId.value,
    ownerId: 'shared',
    color: data.color,
  })
  folders.value.push(newFolder)
}

const handleDownload = (doc: DocumentType) => {
  const blob = new Blob([doc.textContent || doc.name], { type: doc.mimeType || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = doc.previewUrl || url
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
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderSync class="size-6 text-primary" />
            Company Shared Documents
          </h1>
          <Badge variant="secondary">
            Universal Access
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
          General company manuals, OSHA safety guidelines, emergency protocols, and company-wide forms.
        </p>
      </div>

      <!-- Action Buttons (if admin) -->
      <div v-if="isAdmin" class="flex items-center gap-2 flex-wrap">
        <Button size="sm" class="gap-1.5 text-xs shadow-xs" @click="isUploadModalOpen = true">
          <Upload class="size-3.5" />
          <span>Upload to Shared</span>
        </Button>
        <Button variant="outline" size="sm" class="gap-1.5 text-xs" @click="isNewFolderModalOpen = true">
          <FolderPlus class="size-3.5 text-primary" />
          <span>New Folder</span>
        </Button>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <div class="flex items-center justify-between gap-2 border-b pb-3 text-xs">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              class="cursor-pointer hover:text-foreground font-medium"
              :class="!currentFolderId ? 'text-foreground font-semibold' : ''"
              @click="router.push('/shared-documents')"
            >
              Shared Documents Root
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
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search shared files..."
          class="pl-8 h-8 text-xs bg-background"
        />
      </div>

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

    <!-- Folders Section -->
    <div v-if="filteredFolders.length > 0" class="space-y-2.5">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Shared Folders ({{ filteredFolders.length }})
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
        Shared Documents ({{ filteredDocuments.length }})
      </h3>

      <!-- Grid View -->
      <div
        v-if="viewMode === 'grid'"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
      >
        <Card
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="group shadow-2xs hover:border-primary/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          @click="openDocPreview(doc)"
        >
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
      owner-name="Company Shared"
      :target-path-name="currentFolder?.name"
      @close="isUploadModalOpen = false"
      @upload="handleUploadFiles"
    />

    <NewFolderModal
      :is-open="isNewFolderModalOpen"
      owner-name="Company Shared"
      :parent-folder-name="currentFolder?.name"
      @close="isNewFolderModalOpen = false"
      @create="handleCreateFolder"
    />
  </div>
</template>
