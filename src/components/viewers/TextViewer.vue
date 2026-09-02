<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check, FileText, Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  content?: string
  mimeType?: string
  documentName?: string
  dataUrl?: string
}>()

const emit = defineEmits<{
  (e: 'download'): void
}>()

const copied = ref(false)

const isCsv = computed(() => {
  return props.mimeType?.includes('csv') || props.documentName?.endsWith('.csv')
})

const parsedCsv = computed(() => {
  if (!isCsv.value || !props.content) return null
  const lines = props.content.trim().split('\n')
  if (lines.length === 0) return null
  return lines.map((line) => {
    // Basic CSV splitting
    return line.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1').trim())
  })
})

const copyText = async () => {
  if (props.content) {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full bg-muted/40 relative overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b bg-card text-xs shrink-0 z-10">
      <div class="flex items-center gap-2">
        <FileText class="size-3.5 text-primary" />
        <span class="font-medium text-foreground">{{ documentName }}</span>
        <span v-if="content" class="text-[11px] text-muted-foreground">
          ({{ content.length }} characters)
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-7 text-xs gap-1.5"
          @click="copyText"
        >
          <Check v-if="copied" class="size-3.5 text-emerald-500" />
          <Copy v-else class="size-3.5" />
          <span>{{ copied ? 'Copied' : 'Copy Text' }}</span>
        </Button>
      </div>
    </div>

    <!-- Content Stage -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
      <!-- CSV Table View -->
      <div
        v-if="parsedCsv && parsedCsv.length > 0"
        class="w-full max-w-4xl bg-card rounded-xl shadow-lg border overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-muted/60 text-muted-foreground uppercase text-[10px] font-semibold border-b">
              <tr>
                <th
                  v-for="(header, idx) in parsedCsv[0]"
                  :key="idx"
                  class="px-4 py-2.5 border-r last:border-r-0"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="(row, rIdx) in parsedCsv.slice(1)"
                :key="rIdx"
                class="hover:bg-muted/30"
              >
                <td
                  v-for="(cell, cIdx) in row"
                  :key="cIdx"
                  class="px-4 py-2 border-r last:border-r-0 font-mono text-foreground"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- General Text / Code View -->
      <div
        v-else-if="content"
        class="w-full max-w-3xl bg-card rounded-xl shadow-lg border p-6 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto"
      >
        {{ content }}
      </div>

      <!-- Empty / Fallback Card -->
      <div
        v-else
        class="max-w-md w-full bg-card rounded-xl shadow-lg border p-6 text-center space-y-4 my-auto"
      >
        <div class="size-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <FileText class="size-8" />
        </div>
        <div>
          <h3 class="font-semibold text-base">{{ documentName }}</h3>
          <p class="text-xs text-muted-foreground mt-1">{{ mimeType }}</p>
        </div>
        <p class="text-xs text-muted-foreground">
          This file format is ready for local use and offline field synchronization.
        </p>
        <Button class="w-full gap-2" @click="emit('download')">
          <Download class="size-4" />
          Download File
        </Button>
      </div>
    </div>
  </div>
</template>
