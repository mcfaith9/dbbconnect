<script setup lang="ts">
import { ref, watch } from 'vue'
import { FolderPlus, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  isOpen: boolean
  parentFolderName?: string
  ownerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', data: { name: string; color: string }): void
}>()

const folderName = ref('')
const selectedColor = ref('#2563eb')

const colorOptions = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Slate', hex: '#475569' },
]

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      folderName.value = ''
      selectedColor.value = '#2563eb'
    }
  },
)

const handleCreate = () => {
  if (!folderName.value.trim()) return
  emit('create', {
    name: folderName.value.trim(),
    color: selectedColor.value,
  })
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
      class="bg-card text-card-foreground border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FolderPlus class="size-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base">Create New Folder</h3>
            <p v-if="ownerName" class="text-xs text-muted-foreground">
              Workspace: {{ ownerName }}
              <span v-if="parentFolderName"> &rsaquo; {{ parentFolderName }}</span>
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
      <form @submit.prevent="handleCreate" class="p-6 space-y-4">
        <div class="space-y-2">
          <Label for="folder-name-input">Folder Name</Label>
          <Input
            id="folder-name-input"
            v-model="folderName"
            placeholder="e.g. Naga Project, Safety, Drawings"
            autofocus
            required
          />
        </div>

        <div class="space-y-2">
          <Label>Folder Tag Color</Label>
          <div class="flex items-center gap-2.5 pt-1">
            <button
              v-for="color in colorOptions"
              :key="color.hex"
              type="button"
              :style="{ backgroundColor: color.hex }"
              :class="[
                'size-7 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                selectedColor === color.hex ? 'scale-120 ring-2 ring-primary ring-offset-2' : 'hover:scale-110 opacity-85',
              ]"
              :title="color.name"
              @click="selectedColor = color.hex"
            />
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" @click="emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="!folderName.trim()">
            Create Folder
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
