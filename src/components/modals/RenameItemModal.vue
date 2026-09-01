<script setup lang="ts">
import { ref, watch } from 'vue'
import { Edit2, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  isOpen: boolean
  currentName: string
  itemType: 'folder' | 'document'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'rename', newName: string): void
}>()

const newName = ref('')

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      newName.value = props.currentName
    }
  },
  { immediate: true },
)

const handleRename = () => {
  if (!newName.value.trim()) return
  emit('rename', newName.value.trim())
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
      class="bg-card text-card-foreground border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
    >
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Edit2 class="size-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base">Rename {{ itemType === 'folder' ? 'Folder' : 'File' }}</h3>
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

      <form @submit.prevent="handleRename" class="p-6 space-y-4">
        <div class="space-y-2">
          <Label for="rename-item-input">Name</Label>
          <Input
            id="rename-item-input"
            v-model="newName"
            autofocus
            required
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" @click="emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="!newName.trim() || newName === currentName">
            Save
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
