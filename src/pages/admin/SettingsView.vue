<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Settings,
  Save,
  Check,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'

const companyName = ref('DBB Construction & Development Corp.')
const projectCode = ref('NAGA-2026-PH2')
const syncInterval = ref(30)
const isSaved = ref(false)

const apiUrl = ref(api.getApiBaseUrl() || (api.getBaseUrl() ? `${api.getBaseUrl()}/api` : ''))
const isTestingConnection = ref(false)
const connectionStatus = ref<'idle' | 'connected' | 'failed'>('idle')
const connectionMessage = ref('')

const testConnection = async () => {
  if (apiUrl.value) {
    api.setBaseUrl(apiUrl.value, false)
  }
  isTestingConnection.value = true
  connectionStatus.value = 'idle'
  connectionMessage.value = ''
  try {
    const startTime = Date.now()
    const isOnline = await api.checkHealth(true)
    const elapsed = Date.now() - startTime
    if (isOnline) {
      connectionStatus.value = 'connected'
      connectionMessage.value = `Laravel API is online and responding (${elapsed}ms). Health endpoint returned 200 OK.`
    } else {
      connectionStatus.value = 'failed'
      const target = api.getApiBaseUrl() || apiUrl.value
      connectionMessage.value = `Unable to reach ${target}/health. Please verify host, port, and firewall rule.`
    }
  } catch (e: any) {
    connectionStatus.value = 'failed'
    connectionMessage.value = e.message || 'Connection test failed.'
  } finally {
    isTestingConnection.value = false
  }
}

const handleResetApiUrl = () => {
  api.resetBaseUrl()
  apiUrl.value = api.getApiBaseUrl()
  testConnection()
}

const handleSave = () => {
  if (apiUrl.value) {
    api.setBaseUrl(apiUrl.value, true)
  } else {
    api.resetBaseUrl()
    apiUrl.value = api.getApiBaseUrl()
  }
  isSaved.value = true
  setTimeout(() => (isSaved.value = false), 2500)
}

onMounted(() => {
  testConnection()
})
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

    <!-- Live Laravel Backend Connection Status & Diagnostics -->
    <Card class="shadow-xs border">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base font-bold flex items-center gap-2">
              <Server class="size-4 text-primary" />
              Laravel REST API Connection
            </CardTitle>
            <CardDescription>
              Authoritative backend powering multi-PC synchronization and MySQL persistence.
            </CardDescription>
          </div>
          <Badge
            :variant="connectionStatus === 'connected' ? 'default' : connectionStatus === 'failed' ? 'destructive' : 'secondary'"
            class="capitalize"
          >
            {{ connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'failed' ? 'Offline' : 'Checking...' }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="api-url">Laravel API Base URL</Label>
            <button
              type="button"
              class="text-xs text-primary hover:underline"
              @click="handleResetApiUrl"
            >
              Reset to Env Default
            </button>
          </div>
          <div class="flex gap-2">
            <Input id="api-url" v-model="apiUrl" placeholder="e.g. http://192.168.1.38:8000/api or https://api.yourdomain.com/api" class="font-mono text-xs" />
            <Button variant="outline" class="gap-1.5 shrink-0" :disabled="isTestingConnection" @click="testConnection">
              <RefreshCw class="size-3.5" :class="{ 'animate-spin': isTestingConnection }" />
              Test Connection
            </Button>
          </div>
        </div>

        <div
          v-if="connectionMessage"
          class="p-3 rounded-lg text-xs font-medium flex items-center gap-2"
          :class="connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'"
        >
          <CheckCircle2 v-if="connectionStatus === 'connected'" class="size-4 shrink-0" />
          <XCircle v-else class="size-4 shrink-0" />
          <span>{{ connectionMessage }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground border-t">
          <div>
            <span class="font-semibold text-foreground">Sanctum Bearer Token:</span>
            <span class="ml-1.5 font-mono">{{ api.getToken() ? 'Authenticated (Active)' : 'None (Signed Out)' }}</span>
          </div>
          <div>
            <span class="font-semibold text-foreground">Health Endpoint:</span>
            <span class="ml-1.5 font-mono">GET /api/health</span>
          </div>
        </div>
      </CardContent>
    </Card>

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
  </div>
</template>
