<script setup lang="ts">
import { ref, watch } from 'vue'
import { FolderSymlink, X, Folder as FolderIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { FolderService } from '@/services/FolderService'
import type { Folder, Document } from '@/types'

const props = defineProps<{
  isOpen: boolean
  item: Folder | Document | null
  itemType: 'folder' | 'document'
  ownerId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'move', targetFolderId: string | null): void
}>()

const availableFolders = ref<Folder[]>([])
const selectedFolderId = ref<string | null>(null)

const loadFolders = async () => {
  if (!props.ownerId) return
  const folders = await FolderService.getFoldersByOwner(props.ownerId)
  // Don't allow moving folder into itself
  if (props.itemType === 'folder' && props.item) {
    availableFolders.value = folders.filter((f) => f.id !== props.item?.id)
  } else {
    availableFolders.value = folders
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      loadFolders()
      selectedFolderId.value = (props.item as any)?.folderId || (props.item as any)?.parentId || null
    }
  },
  { immediate: true },
)

const handleMove = () => {
  emit('move', selectedFolderId.value)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen && item"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div
      class="bg-card text-card-foreground border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
    >
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FolderSymlink class="size-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base">Move {{ itemType === 'folder' ? 'Folder' : 'File' }}</h3>
            <p class="text-xs text-muted-foreground truncate max-w-[260px]">
              {{ item.name }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground p-1 rounded-md"
          @click="emit('close')"
        >
          <X class="size-4" />
        </button>
      </div>

      <div class="p-6 space-y-3">
        <span class="text-xs font-medium text-muted-foreground">Select Destination Folder</span>
        
        <div class="space-y-1.5 max-h-60 overflow-y-auto">
          <!-- Root option -->
          <div
            :class="[
              'flex items-center gap-2.5 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors',
              selectedFolderId === null ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:bg-accent/50'
            ]"
            @click="selectedFolderId = null"
          >
            <FolderIcon class="size-4 text-muted-foreground" />
            <span>Root (Workspace Home)</span>
          </div>

          <!-- Other folders -->
          <div
            v-for="folder in availableFolders"
            :key="folder.id"
            :class="[
              'flex items-center gap-2.5 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors',
              selectedFolderId === folder.id ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:bg-accent/50'
            ]"
            @click="selectedFolderId = folder.id"
          >
            <div
              class="size-3.5 rounded-sm shrink-0"
              :style="{ backgroundColor: folder.color || '#2563eb' }"
            />
            <span class="truncate">{{ folder.name }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30">
        <Button type="button" variant="outline" @click="emit('close')">
          Cancel
        </Button>
        <Button type="button" class="gap-1.5" @click="handleMove">
          <FolderSymlink class="size-4" />
          Move Here
        </Button>
      </div>
    </div>
  </div>
</template>
