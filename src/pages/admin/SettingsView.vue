<script setup lang="ts">
import { ref } from 'vue'
import {
  Settings,
  Save,
  Check,
  Server,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const companyName = ref('DBB Construction & Development Corp.')
const projectCode = ref('NAGA-2026-PH2')
const syncInterval = ref(30)
const isSaved = ref(false)

const handleSave = () => {
  isSaved.value = true
  setTimeout(() => (isSaved.value = false), 2500)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-5 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings class="size-6 text-primary" />
            System &amp; Sync Configuration
          </h1>
          <Badge variant="outline">
            Admin Only
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage digital field hub settings, PWA sync intervals, and backend connection parameters.
        </p>
      </div>
    </div>

    <!-- Configuration Form -->
    <Card class="shadow-xs">
      <CardHeader>
        <CardTitle class="text-base font-bold">Field Deployment Settings</CardTitle>
        <CardDescription>Configure project metadata and synchronization behavior.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="comp-name">Company Name</Label>
            <Input id="comp-name" v-model="companyName" />
          </div>
          <div class="space-y-2">
            <Label for="proj-code">Primary Project Code</Label>
            <Input id="proj-code" v-model="projectCode" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="sync-interval">Automatic Sync Interval (Seconds when Online)</Label>
          <Input id="sync-interval" type="number" v-model.number="syncInterval" min="5" max="300" />
        </div>

        <div class="pt-2 flex items-center justify-between">
          <span v-if="isSaved" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Check class="size-4" /> Settings updated successfully!
          </span>
          <span v-else />

          <Button class="gap-1.5" @click="handleSave">
            <Save class="size-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Architecture & Backend Migration Readiness Note -->
    <Card class="shadow-xs bg-muted/20 border">
      <CardHeader>
        <CardTitle class="text-base font-bold flex items-center gap-2">
          <Server class="size-4 text-primary" />
          Laravel Backend Migration Architecture
        </CardTitle>
        <CardDescription>
          All data operations are isolated in TypeScript service layers (`DocumentService`, `FolderService`, `UserService`, `SyncService`).
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-2 text-xs text-muted-foreground leading-relaxed">
        <p>
          • <strong>Current Storage:</strong> Zero-dependency browser-native IndexedDB engine (`dbb_fieldhub_indexeddb`).
        </p>
        <p>
          • <strong>Future Laravel Integration:</strong> To connect to a live Laravel REST API, replace the internal IndexedDB calls inside `src/services/*` with standard HTTP Axios/Fetch endpoints without touching any Vue UI components.
        </p>
        <p>
          • <strong>PWA Service Worker:</strong> Assets and document responses are cached for offline zero-connectivity job sites.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
