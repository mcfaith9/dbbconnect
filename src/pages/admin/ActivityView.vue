<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  History,
  Upload,
  Users,
  FolderPlus,
  Trash2,
  MessageSquare,
  HardDriveDownload,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ActivityService } from '@/services/ActivityService'
import type { ActivityLog } from '@/types'

const activities = ref<ActivityLog[]>([])

const loadActivities = async () => {
  activities.value = await ActivityService.getAllActivities()
}

onMounted(loadActivities)

const getBadgeVariant = (type: ActivityLog['type']) => {
  switch (type) {
    case 'upload':
      return 'default'
    case 'assign':
      return 'secondary'
    case 'create_folder':
    case 'folder_create':
      return 'outline'
    case 'comment':
      return 'info'
    case 'delete':
      return 'destructive'
    case 'offline_sync':
      return 'success'
    default:
      return 'default'
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-5 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History class="size-6 text-primary" />
            Audit Activity Trail
          </h1>
          <Badge variant="secondary">
            {{ activities.length }} records
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Detailed audit logs of all file uploads, folder modifications, document assignments, and sync operations.
        </p>
      </div>
    </div>

    <!-- Activities Table / List -->
    <Card v-if="activities.length > 0" class="shadow-xs overflow-hidden">
      <div class="divide-y text-xs">
        <div
          v-for="act in activities"
          :key="act.id"
          class="p-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
        >
          <div class="flex items-start gap-3 min-w-0">
            <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Upload v-if="act.type === 'upload'" class="size-4 text-primary" />
              <Users v-else-if="act.type === 'assign'" class="size-4 text-emerald-600 dark:text-emerald-400" />
              <FolderPlus v-else-if="act.type === 'create_folder' || act.type === 'folder_create'" class="size-4 text-amber-500" />
              <MessageSquare v-else-if="act.type === 'comment'" class="size-4 text-sky-500" />
              <HardDriveDownload v-else-if="act.type === 'offline_sync'" class="size-4 text-emerald-500" />
              <Trash2 v-else class="size-4 text-destructive" />
            </div>

            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-foreground">{{ act.actionTitle }}</span>
                <Badge :variant="getBadgeVariant(act.type)" class="text-[9px] uppercase px-1.5 py-0">
                  {{ act.type.replace('_', ' ') }}
                </Badge>
              </div>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {{ act.description }}
              </p>
              <div class="flex items-center gap-3 text-[10px] text-muted-foreground/80 pt-1">
                <span>By: <strong class="text-foreground">{{ act.userName }}</strong> ({{ act.userRole }})</span>
                <span v-if="act.employeeName">&bull; Employee: <strong class="text-foreground">{{ act.employeeName }}</strong></span>
              </div>
            </div>
          </div>

          <span class="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            {{ new Date(act.timestamp).toLocaleString() }}
          </span>
        </div>
      </div>
    </Card>

    <Card v-else class="p-12 text-center border-dashed">
      <div class="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
        <History class="size-6" />
      </div>
      <h3 class="font-semibold text-base">No audit events recorded yet</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        Actions performed by administrators and field workers (file uploads, folder creation, assignments) will be logged here.
      </p>
    </Card>
  </div>
</template>
