<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Plus,
  Trash2,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface PendingUploadItem {
  id: string
  name: string
  size: number
  sizeFormatted: string
  mimeType: string
  previewUrl?: string
  file?: File
}

const props = defineProps<{
  isOpen: boolean
  targetPathName?: string
  ownerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', files: PendingUploadItem[]): void
}>()

const pendingFiles = ref<PendingUploadItem[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Preset quick files for quick testing without needing local files
const quickPresets = [
  {
    name: 'Safety Orientation.pdf',
    size: 2411724,
    sizeFormatted: '2.3 MB',
    mimeType: 'application/pdf',
  },
  {
    name: 'Site Inspection Report.docx',
    size: 891280,
    sizeFormatted: '870 KB',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    name: 'Site Photo Morning.jpg',
    size: 1887436,
    sizeFormatted: '1.8 MB',
    mimeType: 'image/jpeg',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Work Permit Naga Site.pdf',
    size: 1468006,
    sizeFormatted: '1.4 MB',
    mimeType: 'application/pdf',
  },
]

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      pendingFiles.value = []
    }
  },
)

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return
  Array.from(target.files).forEach((file) => {
    pendingFiles.value.push({
      id: `pending-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      mimeType: file.type || 'application/octet-stream',
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    })
  })
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (!event.dataTransfer?.files) return
  Array.from(event.dataTransfer.files).forEach((file) => {
    pendingFiles.value.push({
      id: `pending-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      mimeType: file.type || 'application/octet-stream',
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    })
  })
}

const addPreset = (preset: typeof quickPresets[0]) => {
  pendingFiles.value.push({
    id: `preset-${Date.now()}-${Math.random()}`,
    name: preset.name,
    size: preset.size,
    sizeFormatted: preset.sizeFormatted,
    mimeType: preset.mimeType,
    previewUrl: preset.previewUrl,
  })
}

const removePendingFile = (id: string) => {
  pendingFiles.value = pendingFiles.value.filter((f) => f.id !== id)
}

const handleUploadSubmit = () => {
  if (pendingFiles.value.length === 0) return
  emit('upload', pendingFiles.value)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div
      class="bg-card text-card-foreground border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Upload class="size-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base">Upload Field Documents</h3>
            <p v-if="ownerName" class="text-xs text-muted-foreground">
              Target: <span class="font-medium text-foreground">{{ ownerName }}</span>
              <span v-if="targetPathName"> &rsaquo; {{ targetPathName }}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          @click="emit('close')"
        >
          <X class="size-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <!-- Drag & Drop Zone -->
        <div
          :class="[
            'border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Upload class="size-5 text-muted-foreground" />
          </div>
          <p class="text-sm font-medium">Click to select files or drag and drop</p>
          <p class="text-xs text-muted-foreground mt-1">
            Supports PDF, DOCX, XLSX, PPTX, JPG, PNG (Max 50MB)
          </p>
        </div>

        <!-- Quick Template Presets -->
        <div>
          <Label class="text-xs text-muted-foreground mb-2 block">Or quickly add field presets:</Label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in quickPresets"
              :key="preset.name"
              type="button"
              class="flex items-center gap-2 p-2 rounded-lg border text-left text-xs hover:bg-accent transition-colors group"
              @click="addPreset(preset)"
            >
              <Plus class="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              <span class="truncate font-medium flex-1">{{ preset.name }}</span>
            </button>
          </div>
        </div>

        <!-- Staged Files List -->
        <div v-if="pendingFiles.length > 0" class="space-y-2 pt-2 border-t">
          <Label class="text-xs font-semibold">Staged Files ({{ pendingFiles.length }})</Label>
          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <div
              v-for="file in pendingFiles"
              :key="file.id"
              class="flex items-center justify-between p-2 rounded-md bg-muted/60 text-xs border"
            >
              <div class="flex items-center gap-2 truncate pr-2">
                <FileText v-if="file.mimeType.includes('pdf')" class="size-4 text-red-500 shrink-0" />
                <ImageIcon v-else-if="file.mimeType.includes('image')" class="size-4 text-blue-500 shrink-0" />
                <FileSpreadsheet v-else-if="file.mimeType.includes('sheet')" class="size-4 text-emerald-500 shrink-0" />
                <FileText v-else class="size-4 text-primary shrink-0" />
                <span class="font-medium truncate">{{ file.name }}</span>
                <span class="text-muted-foreground shrink-0">({{ file.sizeFormatted }})</span>
              </div>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive p-1 rounded-sm"
                @click="removePendingFile(file.id)"
              >
                <Trash2 class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/30">
        <span class="text-xs text-muted-foreground">
          Files will automatically belong to this workspace
        </span>
        <div class="flex items-center gap-2">
          <Button type="button" variant="outline" @click="emit('close')">
            Cancel
          </Button>
          <Button
            type="button"
            :disabled="pendingFiles.length === 0"
            class="gap-1.5"
            @click="handleUploadSubmit"
          >
            <Upload class="size-4" />
            Upload {{ pendingFiles.length > 0 ? `(${pendingFiles.length})` : '' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
