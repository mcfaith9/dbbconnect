<script setup lang="ts">
import { ref } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  imageUrl?: string
  altText?: string
}>()

const zoom = ref(100)
const rotation = ref(0)

const zoomIn = () => {
  if (zoom.value < 300) zoom.value += 20
}

const zoomOut = () => {
  if (zoom.value > 40) zoom.value -= 20
}

const resetZoom = () => {
  zoom.value = 100
  rotation.value = 0
}

const rotateClockwise = () => {
  rotation.value = (rotation.value + 90) % 360
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
          :disabled="zoom <= 40"
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
          :disabled="zoom >= 300"
          title="Zoom In"
          @click="zoomIn"
        >
          <ZoomIn class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground"
          title="Reset"
          @click="resetZoom"
        >
          <RotateCcw class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground"
          title="Rotate 90°"
          @click="rotateClockwise"
        >
          <RotateCw class="size-3.5" />
        </Button>
      </div>

      <span class="text-[11px] text-muted-foreground font-medium">Image Preview</span>
    </div>

    <!-- Image Stage -->
    <div class="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
      <div
        class="transition-transform duration-100 flex items-center justify-center"
        :style="{
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }"
      >
        <img
          :src="imageUrl"
          :alt="altText || 'Field photo'"
          class="max-h-[68vh] max-w-full rounded-lg shadow-xl border object-contain bg-background"
        />
      </div>
    </div>
  </div>
</template>
