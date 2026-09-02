<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  pdfUrl?: string
  dataUrl?: string
  initialPage?: number
  zoomLevel?: number
}>()

const emit = defineEmits<{
  (e: 'update:zoom', zoom: number): void
  (e: 'update:page', page: number, total: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentPage = ref(props.initialPage || 1)
const numPages = ref(1)
const zoom = ref(props.zoomLevel || 100)
const isLoading = ref(true)
const errorMessage = ref('')
const isFullscreen = ref(false)

let pdfDoc: any = null
let currentRenderTask: any = null

const initPdf = async () => {
  const source = props.dataUrl || props.pdfUrl
  if (!source) {
    errorMessage.value = 'No PDF document source provided.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const pdfjs = await import('pdfjs-dist')
    // Set worker if needed or load document with worker disabled
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    }

    const loadingTask = pdfjs.getDocument({
      url: source,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    })

    pdfDoc = await loadingTask.promise
    numPages.value = pdfDoc.numPages
    emit('update:page', currentPage.value, numPages.value)
    await renderPage(currentPage.value)
  } catch (err: any) {
    console.warn('PDF.js loading note:', err)
    errorMessage.value = err?.message || 'Could not render PDF via canvas viewer. Using embedded preview fallback.'
  } finally {
    isLoading.value = false
  }
}

const renderPage = async (pageNum: number) => {
  if (!pdfDoc || !canvasRef.value) return

  try {
    if (currentRenderTask) {
      currentRenderTask.cancel()
    }

    const page = await pdfDoc.getPage(pageNum)
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    if (!context) return

    const pixelRatio = window.devicePixelRatio || 1
    const baseScale = (zoom.value / 100) * 1.5
    const viewport = page.getViewport({ scale: baseScale })

    canvas.height = viewport.height * pixelRatio
    canvas.width = viewport.width * pixelRatio
    canvas.style.height = `${viewport.height}px`
    canvas.style.width = `${viewport.width}px`

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    const renderContext = {
      canvasContext: context,
      viewport,
    }

    currentRenderTask = page.render(renderContext)
    await currentRenderTask.promise
  } catch (err: any) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn('Page render error', err)
    }
  }
}

watch(
  () => [props.pdfUrl, props.dataUrl],
  () => {
    currentPage.value = 1
    initPdf()
  },
)

watch(currentPage, (val) => {
  emit('update:page', val, numPages.value)
  renderPage(val)
})

watch(zoom, (val) => {
  emit('update:zoom', val)
  renderPage(currentPage.value)
})

onMounted(() => {
  initPdf()
})

onUnmounted(() => {
  if (currentRenderTask) {
    currentRenderTask.cancel()
  }
})

const handlePrev = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleNext = () => {
  if (currentPage.value < numPages.value) {
    currentPage.value++
  }
}

const zoomIn = () => {
  if (zoom.value < 250) zoom.value += 15
}

const zoomOut = () => {
  if (zoom.value > 50) zoom.value -= 15
}

const resetZoom = () => {
  zoom.value = 100
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}
</script>

<template>
  <div
    ref="containerRef"
    :class="[
      'flex flex-col h-full w-full bg-muted/40 relative overflow-hidden',
      isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''
    ]"
  >
    <!-- PDF Viewer Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b bg-card text-xs shrink-0 z-10">
      <!-- Zoom Controls -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          :disabled="zoom <= 50"
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
          :disabled="zoom >= 250"
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

      <!-- Page Flip Controls -->
      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          class="size-7"
          :disabled="currentPage <= 1 || isLoading"
          title="Previous Page"
          @click="handlePrev"
        >
          <ChevronLeft class="size-3.5" />
        </Button>
        <div class="flex items-center gap-1 font-mono text-[11px] px-1">
          <span class="font-bold text-foreground">{{ currentPage }}</span>
          <span class="text-muted-foreground">/</span>
          <span class="text-muted-foreground">{{ numPages }}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          class="size-7"
          :disabled="currentPage >= numPages || isLoading"
          title="Next Page"
          @click="handleNext"
        >
          <ChevronRight class="size-3.5" />
        </Button>
      </div>

      <!-- View Controls -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground"
          :title="isFullscreen ? 'Exit Full View' : 'Full View'"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="isFullscreen" class="size-3.5" />
          <Maximize2 v-else class="size-3.5" />
        </Button>
      </div>
    </div>

    <!-- PDF Canvas / Content Display Area -->
    <div ref="containerRef" class="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center relative">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 class="size-8 animate-spin text-primary" />
        <span class="text-xs">Loading PDF document...</span>
      </div>

      <!-- Canvas Render -->
      <div
        v-show="!isLoading && !errorMessage"
        class="shadow-xl rounded border border-border/80 bg-white dark:bg-zinc-900 transition-transform duration-100 flex items-center justify-center overflow-hidden"
      >
        <canvas ref="canvasRef" class="block max-w-full" />
      </div>

      <!-- Fallback Object / Embed if canvas has issue -->
      <div v-if="!isLoading && errorMessage" class="w-full h-full flex flex-col items-center justify-center p-4">
        <iframe
          v-if="dataUrl || pdfUrl"
          :src="dataUrl || pdfUrl"
          class="w-full h-full rounded-lg border shadow-sm"
          title="PDF Document"
        />
        <div v-else class="text-center space-y-2 p-6 bg-card rounded-xl border max-w-sm">
          <AlertCircle class="size-8 text-amber-500 mx-auto" />
          <p class="text-xs text-muted-foreground">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
