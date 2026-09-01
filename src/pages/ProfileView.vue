<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckCircle2,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DocumentService } from '@/services/DocumentService'
import { useAuth } from '@/composables/useAuth'
import { useOfflineSync } from '@/composables/useOfflineSync'
import type { Document } from '@/types'

const { currentUser, isAdmin } = useAuth()
const {
  effectiveOnline,
  isSimulatedOffline,
  lastSyncedFormatted,
  pendingCount,
  triggerSync,
  toggleSimulatedOffline,
} = useOfflineSync()

const offlineDocs = ref<Document[]>([])
const isClearingCache = ref(false)

const loadOfflineDocs = async () => {
  offlineDocs.value = await DocumentService.getOfflineCachedDocuments(
    currentUser.value?.role === 'employee' ? currentUser.value.id : undefined,
  )
}

onMounted(loadOfflineDocs)

const clearAllOfflineCache = async () => {
  if (!confirm('Remove all cached documents from local storage? You can re-download them whenever online.')) return
  isClearingCache.value = true
  for (const doc of offlineDocs.value) {
    await DocumentService.toggleOfflineCache(doc.id, false)
  }
  await loadOfflineDocs()
  isClearingCache.value = false
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
    <!-- Profile Card Header -->
    <Card class="shadow-xs">
      <CardContent class="p-6">
        <div class="flex flex-col sm:flex-row items-center gap-5">
          <Avatar class="size-20 border-2 border-primary">
            <AvatarFallback class="bg-primary/10 text-primary font-bold text-2xl">
              {{ currentUser?.name.split(' ').map((n) => n[0]).join('') }}
            </AvatarFallback>
          </Avatar>

          <div class="space-y-1 text-center sm:text-left flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 class="text-xl font-bold text-foreground">{{ currentUser?.name }}</h2>
              <Badge :variant="isAdmin ? 'default' : 'secondary'">
                {{ isAdmin ? 'Administrator' : 'Field Employee' }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground">{{ currentUser?.email }}</p>
            <p class="text-xs text-muted-foreground">
              Position: <span class="font-semibold text-foreground">{{ currentUser?.position }}</span>
              &bull; Department: {{ currentUser?.department }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- PWA & IndexedDB Offline Diagnostic Center -->
    <Card class="shadow-xs">
      <CardHeader>
        <CardTitle class="text-base font-bold flex items-center gap-2">
          <Database class="size-4 text-primary" />
          Offline Device Storage &amp; PWA Diagnostics
        </CardTitle>
        <CardDescription>
          DBB FieldHub uses high-capacity IndexedDB for persistent field file caching and automatic syncing.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 rounded-lg border bg-muted/20">
            <span class="text-xs text-muted-foreground block">Network Connection</span>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="['size-2.5 rounded-full', effectiveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500']"
              />
              <span class="text-sm font-bold text-foreground">
                {{ effectiveOnline ? 'Online (Connected)' : 'Offline (Simulated/Zero-Signal)' }}
              </span>
            </div>
          </div>

          <div class="p-3.5 rounded-lg border bg-muted/20">
            <span class="text-xs text-muted-foreground block">IndexedDB Cached Files</span>
            <span class="text-lg font-bold text-foreground mt-1 block">
              {{ offlineDocs.length }} documents
            </span>
          </div>

          <div class="p-3.5 rounded-lg border bg-muted/20">
            <span class="text-xs text-muted-foreground block">Pending Sync Actions</span>
            <span class="text-lg font-bold text-foreground mt-1 block">
              {{ pendingCount }} queued
            </span>
          </div>
        </div>

        <!-- Offline Cached Files List -->
        <div class="space-y-2 pt-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Locally Cached Offline Documents
            </h4>
            <Button
              v-if="offlineDocs.length > 0"
              variant="outline"
              size="sm"
              class="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
              :disabled="isClearingCache"
              @click="clearAllOfflineCache"
            >
              <Trash2 class="size-3" />
              <span>Clear Cache</span>
            </Button>
          </div>

          <div v-if="offlineDocs.length === 0" class="text-center py-6 border rounded-lg bg-muted/10 text-xs text-muted-foreground">
            No documents currently saved for offline usage. Open any file and click "Make Available Offline".
          </div>

          <div v-else class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="doc in offlineDocs"
              :key="doc.id"
              class="flex items-center justify-between p-2.5 rounded-md border bg-card text-xs"
            >
              <div class="flex items-center gap-2 truncate pr-2">
                <CheckCircle2 class="size-3.5 text-emerald-500 shrink-0" />
                <span class="font-medium truncate">{{ doc.name }}</span>
                <span class="text-muted-foreground shrink-0">({{ doc.sizeFormatted }})</span>
              </div>
              <Badge variant="success" class="text-[9px] shrink-0">
                Ready Offline
              </Badge>
            </div>
          </div>
        </div>

        <!-- Sync Controls -->
        <div class="flex items-center justify-between pt-4 border-t gap-2 flex-wrap">
          <span class="text-xs text-muted-foreground">
            Last successful sync: {{ lastSyncedFormatted }}
          </span>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="text-xs gap-1.5"
              @click="toggleSimulatedOffline"
            >
              <WifiOff v-if="!isSimulatedOffline" class="size-3.5 text-muted-foreground" />
              <Wifi v-else class="size-3.5 text-emerald-500" />
              <span>{{ isSimulatedOffline ? 'End Offline Test' : 'Test Offline Mode' }}</span>
            </Button>
            <Button
              size="sm"
              class="text-xs gap-1.5"
              :disabled="!effectiveOnline"
              @click="triggerSync"
            >
              <RefreshCw class="size-3.5" />
              <span>Sync with Server</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
