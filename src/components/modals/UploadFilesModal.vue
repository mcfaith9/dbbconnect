<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  FileCode,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { processUploadedFile, type ProcessedFileInfo } from '@/utils/fileProcessor'

const props = defineProps<{
  isOpen: boolean
  targetPathName?: string
  ownerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', files: ProcessedFileInfo[]): void
}>()

const stagedFiles = ref<ProcessedFileInfo[]>([])
const isDragging = ref(false)
const isProcessing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      stagedFiles.value = []
      isProcessing.value = false
    }
  },
)

const handleFileList = async (files: FileList | File[]) => {
  if (!files || files.length === 0) return
  isProcessing.value = true

  const fileArray = Array.from(files)
  for (const file of fileArray) {
    try {
      const processed = await processUploadedFile(file)
      stagedFiles.value.push(processed)
    } catch (err) {
      console.warn('Failed to process file', file.name, err)
    }
  }

  isProcessing.value = false
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFileList(target.files)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    handleFileList(event.dataTransfer.files)
  }
}

const removeFile = (index: number) => {
  stagedFiles.value.splice(index, 1)
}

const clearAll = () => {
  stagedFiles.value = []
}

const handleSubmit = () => {
  if (stagedFiles.value.length === 0) return
  emit('upload', stagedFiles.value)
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
            <h3 class="font-semibold text-base">Upload Documents &amp; Files</h3>
            <p v-if="ownerName" class="text-xs text-muted-foreground">
              Target Workspace: <span class="font-medium text-foreground">{{ ownerName }}</span>
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
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors flex flex-col items-center justify-center cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.svg,.txt,.md,.json"
            @change="handleFileSelect"
          />
          <div class="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Upload class="size-6" />
          </div>
          <p class="text-sm font-semibold text-foreground">Click to browse or drag and drop files here</p>
          <p class="text-xs text-muted-foreground mt-1">
            Accepts PDF, DOCX, Excel/CSV, Images (JPG, PNG, SVG), and Text documents
          </p>
        </div>

        <!-- Processing status indicator -->
        <div
          v-if="isProcessing"
          class="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground"
        >
          <Loader2 class="size-4 animate-spin text-primary" />
          <span>Processing and indexing file contents for offline storage...</span>
        </div>

        <!-- Staged Files List -->
        <div v-if="stagedFiles.length > 0" class="space-y-2 pt-2 border-t">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-semibold text-foreground">
              Selected Files ({{ stagedFiles.length }})
            </Label>
            <button
              type="button"
              class="text-xs text-muted-foreground hover:text-destructive transition-colors"
              @click="clearAll"
            >
              Clear All
            </button>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="(file, idx) in stagedFiles"
              :key="`${file.name}-${idx}`"
              class="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs hover:border-primary/40 transition-colors"
            >
              <div class="flex items-center gap-3 truncate pr-2 min-w-0">
                <!-- Thumbnail / Icon -->
                <img
                  v-if="file.type === 'image' && (file.previewUrl || file.dataUrl)"
                  :src="file.previewUrl || file.dataUrl"
                  :alt="file.name"
                  class="size-8 rounded object-cover border shrink-0 bg-background"
                />
                <div
                  v-else
                  class="size-8 rounded flex items-center justify-center bg-card border shrink-0"
                >
                  <FileText v-if="file.type === 'pdf'" class="size-4 text-red-500" />
                  <FileText v-else-if="file.type === 'word'" class="size-4 text-blue-600" />
                  <FileSpreadsheet v-else-if="file.type === 'excel'" class="size-4 text-emerald-600" />
                  <ImageIcon v-else-if="file.type === 'image'" class="size-4 text-amber-500" />
                  <FileCode v-else class="size-4 text-primary" />
                </div>

                <div class="truncate flex flex-col">
                  <span class="font-medium truncate text-foreground">{{ file.name }}</span>
                  <div class="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{{ file.sizeFormatted }}</span>
                    <span v-if="file.pageCount">&bull; {{ file.pageCount }} page(s)</span>
                    <span v-if="file.docxHtml">&bull; Formatted doc</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <CheckCircle2 class="size-3.5 text-emerald-500 mr-1" />
                <button
                  type="button"
                  class="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  title="Remove file"
                  @click="removeFile(idx)"
                >
                  <Trash2 class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/30">
        <span class="text-xs text-muted-foreground">
          Files persist locally in browser IndexedDB
        </span>
        <div class="flex items-center gap-2">
          <Button type="button" variant="outline" @click="emit('close')">
            Cancel
          </Button>
          <Button
            type="button"
            :disabled="stagedFiles.length === 0 || isProcessing"
            class="gap-1.5"
            @click="handleSubmit"
          >
            <Upload class="size-4" />
            Upload {{ stagedFiles.length > 0 ? `(${stagedFiles.length})` : '' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
