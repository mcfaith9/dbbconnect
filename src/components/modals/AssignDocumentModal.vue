<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { UserCheck, X, Check, Users } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserService } from '@/services/UserService'
import type { Document, User } from '@/types'

const props = defineProps<{
  isOpen: boolean
  document: Document | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned', employeeIds: string[]): void
}>()

const employees = ref<User[]>([])
const selectedEmployeeIds = ref<string[]>([])

const loadEmployees = async () => {
  employees.value = await UserService.getFieldEmployees()
}

onMounted(loadEmployees)

watch(
  () => props.document,
  (doc) => {
    if (doc) {
      selectedEmployeeIds.value = [...(doc.assignedTo || [])]
    }
  },
  { immediate: true },
)

const toggleEmployee = (empId: string) => {
  const index = selectedEmployeeIds.value.indexOf(empId)
  if (index >= 0) {
    selectedEmployeeIds.value.splice(index, 1)
  } else {
    selectedEmployeeIds.value.push(empId)
  }
}

const selectAll = () => {
  selectedEmployeeIds.value = employees.value.map((e) => e.id)
}

const clearAll = () => {
  selectedEmployeeIds.value = []
}

const handleSave = () => {
  emit('assigned', selectedEmployeeIds.value)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen && document"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div
      class="bg-card text-card-foreground border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Users class="size-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base">Assign Document</h3>
            <p class="text-xs text-muted-foreground truncate max-w-[260px]">
              {{ document.name }}
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
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">Select Field Employees</span>
          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              class="text-primary hover:underline"
              @click="selectAll"
            >
              Select All
            </button>
            <span class="text-muted-foreground">&bull;</span>
            <button
              type="button"
              class="text-muted-foreground hover:underline"
              @click="clearAll"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="emp in employees"
            :key="emp.id"
            :class="[
              'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
              selectedEmployeeIds.includes(emp.id)
                ? 'border-primary bg-primary/5'
                : 'hover:bg-accent/50',
            ]"
            @click="toggleEmployee(emp.id)"
          >
            <div class="flex items-center gap-3">
              <Avatar class="size-9 border">
                <AvatarFallback class="bg-primary/10 text-primary text-xs font-semibold">
                  {{ emp.name.split(' ').map((n) => n[0]).join('') }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col text-left">
                <span class="text-sm font-medium">{{ emp.name }}</span>
                <span class="text-xs text-muted-foreground">{{ emp.position }}</span>
              </div>
            </div>

            <div
              :class="[
                'size-5 rounded flex items-center justify-center border transition-colors',
                selectedEmployeeIds.includes(emp.id)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/30',
              ]"
            >
              <Check v-if="selectedEmployeeIds.includes(emp.id)" class="size-3.5 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/30">
        <span class="text-xs text-muted-foreground">
          {{ selectedEmployeeIds.length }} employee(s) selected
        </span>
        <div class="flex items-center gap-2">
          <Button type="button" variant="outline" @click="emit('close')">
            Cancel
          </Button>
          <Button type="button" class="gap-1.5" @click="handleSave">
            <UserCheck class="size-4" />
            Save Assignments
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
