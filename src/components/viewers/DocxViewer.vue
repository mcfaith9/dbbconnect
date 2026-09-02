<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Loader2,
  Copy,
  Check,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import mammoth from 'mammoth'

const props = defineProps<{
  htmlContent?: string
  textContent?: string
  dataUrl?: string
  documentName?: string
}>()

const renderedHtml = ref(props.htmlContent || '')
const rawText = ref(props.textContent || '')
const zoom = ref(100)
const isLoading = ref(false)
const copied = ref(false)

const loadDocx = async () => {
  if (props.htmlContent) {
    renderedHtml.value = props.htmlContent
    return
  }

  if (props.dataUrl && props.dataUrl.startsWith('data:')) {
    isLoading.value = true
    try {
      const base64 = props.dataUrl.split(',')[1]
      const binaryString = window.atob(base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const arrayBuffer = bytes.buffer

      const res = await mammoth.convertToHtml({ arrayBuffer })
      renderedHtml.value = res.value
      const textRes = await mammoth.extractRawText({ arrayBuffer })
      rawText.value = textRes.value
    } catch (err) {
      console.warn('Docx conversion error', err)
      if (props.textContent) {
        rawText.value = props.textContent
      }
    } finally {
      isLoading.value = false
    }
  }
}

watch(
  () => [props.htmlContent, props.dataUrl, props.textContent],
  () => {
    loadDocx()
  },
  { immediate: true },
)

onMounted(loadDocx)

const zoomIn = () => {
  if (zoom.value < 200) zoom.value += 15
}

const zoomOut = () => {
  if (zoom.value > 60) zoom.value -= 15
}

const resetZoom = () => {
  zoom.value = 100
}

const copyContent = async () => {
  const text = rawText.value || renderedHtml.value.replace(/<[^>]*>?/gm, '')
  if (text) {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full bg-muted/40 relative overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b bg-card text-xs shrink-0 z-10">
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          :disabled="zoom <= 60"
          title="Zoom Out"
          @click="zoomOut"
        >
          <ZoomOut class="size-3.5" />
        </Button>
        <span class="w-12 text-center text-muted-foreground font-mono text-[11px]">{{ zoom }}%</span>
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          :disabled="zoom >= 200"
          title="Zoom In"
          @click="zoomIn"
        >
          <ZoomIn class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground"
          title="Reset Zoom"
          @click="resetZoom"
        >
          <RotateCcw class="size-3.5" />
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-7 text-xs gap-1.5"
          @click="copyContent"
        >
          <Check v-if="copied" class="size-3.5 text-emerald-500" />
          <Copy v-else class="size-3.5" />
          <span>{{ copied ? 'Copied' : 'Copy Text' }}</span>
        </Button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center">
      <div v-if="isLoading" class="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 class="size-8 animate-spin text-primary" />
        <span class="text-xs">Rendering Word Document...</span>
      </div>

      <!-- Document Sheet Container -->
      <div
        v-else
        class="w-full max-w-3xl bg-card rounded-lg shadow-xl border p-8 sm:p-12 text-foreground transition-transform duration-100 min-h-[600px]"
        :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
      >
        <!-- Header Banner -->
        <div class="border-b pb-4 mb-6 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="size-7 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              W
            </div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ documentName || 'Word Document Viewer' }}
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground">Formatted View</span>
        </div>

        <!-- Rendered DOCX HTML -->
        <div
          v-if="renderedHtml"
          class="docx-rendered-content prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4"
          v-html="renderedHtml"
        />

        <!-- Plain Text Fallback -->
        <div
          v-else-if="rawText"
          class="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90"
        >
          {{ rawText }}
        </div>

        <!-- Empty / Unrenderable State -->
        <div v-else class="text-center py-16 text-muted-foreground">
          <FileText class="size-10 mx-auto mb-2 opacity-40" />
          <p class="text-sm font-medium">Document content is ready for offline download.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.docx-rendered-content) h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--foreground);
}
:deep(.docx-rendered-content) h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--foreground);
}
:deep(.docx-rendered-content) h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: var(--foreground);
}
:deep(.docx-rendered-content) p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}
:deep(.docx-rendered-content) table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}
:deep(.docx-rendered-content) th,
:deep(.docx-rendered-content) td {
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
:deep(.docx-rendered-content) ul,
:deep(.docx-rendered-content) ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}
:deep(.docx-rendered-content) li {
  margin-bottom: 0.25rem;
}
</style>
