<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, HardHat, ArrowRight, Lock, UserRound as UserIcon, AlertCircle, Loader2, Server, RefreshCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const { login, getTestAccounts, initAuth } = useAuth()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const testAccounts = ref(getTestAccounts())

// API Server Connection Diagnostics for Multi-device LAN Testing
const currentApiUrl = ref(api.getBaseUrl() || 'http://192.168.1.38:8000')
const serverStatus = ref<'checking' | 'online' | 'offline'>('checking')
const isCheckingServer = ref(false)
const showServerConfig = ref(false)
const configUrlInput = ref(currentApiUrl.value)

const checkServerHealth = async () => {
  isCheckingServer.value = true
  serverStatus.value = 'checking'
  try {
    const online = await api.checkHealth(true)
    serverStatus.value = online ? 'online' : 'offline'
  } catch {
    serverStatus.value = 'offline'
  } finally {
    isCheckingServer.value = false
  }
}

const handleSwitchToLan = async () => {
  api.setBaseUrl('http://192.168.1.38:8000', true)
  currentApiUrl.value = api.getBaseUrl()
  configUrlInput.value = currentApiUrl.value
  errorMessage.value = ''
  await checkServerHealth()
}

const handleSaveCustomApiUrl = async () => {
  if (configUrlInput.value) {
    api.setBaseUrl(configUrlInput.value, true)
  } else {
    api.resetBaseUrl()
  }
  currentApiUrl.value = api.getBaseUrl()
  showServerConfig.value = false
  errorMessage.value = ''
  await checkServerHealth()
}

onMounted(async () => {
  // If stored custom URL was previously 100.87.162.99, immediately enforce 192.168.1.38
  if (currentApiUrl.value.includes('100.87.162.99')) {
    api.setBaseUrl('http://192.168.1.38:8000', true)
    currentApiUrl.value = api.getBaseUrl()
    configUrlInput.value = currentApiUrl.value
  }

  await initAuth()
  testAccounts.value = getTestAccounts()
  checkServerHealth()
})

const adminAccounts = testAccounts.value.filter((a) => a.role === 'admin')
const employeeAccounts = testAccounts.value.filter((a) => a.role === 'employee')

const handleLogin = async () => {
  errorMessage.value = ''
  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter your username and password'
    return
  }

  isLoading.value = true
  try {
    const result = await login(username.value, password.value)
    if (result.success && result.user) {
      const redirectTarget = (route.query.redirect as string) || (result.user.role === 'admin' ? '/field-manager' : '/my-files')
      router.push(redirectTarget)
    } else {
      errorMessage.value = result.error || 'Invalid username or password'
    }
  } catch (e: any) {
    errorMessage.value = e?.message || 'An error occurred during login. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleQuickLogin = async (account: any) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const userOrEmail = account.username || account.email || account.name
    const res = await login(userOrEmail, 'ilovedbb')
    if (res.success && res.user) {
      const redirectTarget = (route.query.redirect as string) || (res.user.role === 'admin' ? '/field-manager' : '/my-files')
      router.push(redirectTarget)
    } else {
      errorMessage.value = res.error || 'Quick login failed.'
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Quick login failed. Please try manual login.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted/30 relative">
    <Card class="w-full max-w-lg border bg-card shadow-sm">
      <CardHeader class="space-y-3 text-center pb-4 pt-6">
        <div class="size-12 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center mx-auto shadow-xs overflow-hidden">
          <img src="@/assets/img/dbblogo.png" alt="DBB Connect" class="size-12 object-contain" />
        </div>
        <div>
          <CardTitle class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">DBB Connect</CardTitle>
          <CardDescription class="text-xs text-muted-foreground mt-1">
            Digital Field File Management &amp; Offline Document Access
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-5 px-6">
        <!-- Backend API Server Bar & Diagnostics for Multi-Device LAN Testing -->
        <div class="rounded-lg border bg-muted/40 p-2.5 text-xs space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <Server class="size-3.5 text-primary shrink-0" />
              <span class="text-[11px] font-mono text-foreground font-medium truncate" :title="currentApiUrl">
                {{ currentApiUrl }}
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                :class="serverStatus === 'online' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'"
              >
                <span class="size-1.5 rounded-full" :class="serverStatus === 'online' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'" />
                {{ serverStatus === 'online' ? 'Online' : 'Offline' }}
              </span>
              <button
                type="button"
                class="text-[11px] text-primary hover:underline px-1 py-0.5"
                @click="showServerConfig = !showServerConfig"
              >
                {{ showServerConfig ? 'Close' : 'Config' }}
              </button>
            </div>
          </div>

          <!-- Tailscale to LAN Switch Quick Action Banner -->
          <div
            v-if="currentApiUrl.includes('100.87.162.99')"
            class="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] flex items-center justify-between gap-2"
          >
            <span>Targeting old Tailscale IP. Switch to WiFi LAN:</span>
            <Button size="sm" variant="default" class="h-6 text-[10px] px-2" @click="handleSwitchToLan">
              Use 192.168.1.38:8000
            </Button>
          </div>

          <!-- Expandable API URL Editor -->
          <div v-if="showServerConfig" class="pt-2 border-t space-y-2">
            <div class="flex gap-1.5">
              <Input
                v-model="configUrlInput"
                class="h-7 text-xs font-mono"
                placeholder="http://192.168.1.38:8000"
              />
              <Button size="sm" class="h-7 text-xs px-2 shrink-0" @click="handleSaveCustomApiUrl">
                Save
              </Button>
            </div>
            <div class="flex items-center justify-between text-[10px] text-muted-foreground">
              <button type="button" class="hover:underline text-primary" @click="handleSwitchToLan">
                Default to 192.168.1.38:8000
              </button>
              <button type="button" class="hover:underline flex items-center gap-1" :disabled="isCheckingServer" @click="checkServerHealth">
                <RefreshCw class="size-3" :class="{ 'animate-spin': isCheckingServer }" />
                Test Health
              </button>
            </div>
          </div>
        </div>

        <!-- Error Alert with 1-Click Fix -->
        <div
          v-if="errorMessage"
          class="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in duration-200 space-y-2"
        >
          <div class="flex items-center gap-2">
            <AlertCircle class="size-4 shrink-0" />
            <span class="break-words">{{ errorMessage }}</span>
          </div>
          <div v-if="errorMessage.includes('100.87.162.99')" class="pt-1 flex items-center gap-2">
            <Button size="sm" variant="outline" class="h-6 text-[10px] px-2 bg-background" @click="handleSwitchToLan">
              Switch to http://192.168.1.38:8000 (LAN)
            </Button>
          </div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1.5">
            <Label for="username" class="text-xs font-semibold">Username or Email</Label>
            <div class="relative">
              <UserIcon class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                v-model="username"
                class="pl-9 text-sm"
                placeholder="e.g. dmbbadmin or admin@dbb.com"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-xs font-semibold">Password</Label>
            </div>
            <div class="relative">
              <Lock class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                v-model="password"
                class="pl-9 text-sm"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" class="w-full font-semibold shadow-sm" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="size-4 mr-2 animate-spin" />
            <span v-if="!isLoading">Sign In to Connect</span>
            <span v-else>Signing in...</span>
          </Button>
        </form>

        <!-- Divider -->
        <div class="relative flex items-center justify-center my-2">
          <div class="border-t w-full border-border/80" />
          <span class="bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
            Official Test Accounts
          </span>
          <div class="border-t w-full border-border/80" />
        </div>

        <!-- Quick 1-Click Test Accounts Grid -->
        <div class="space-y-3">
          <!-- Admins Section -->
          <div>
            <p class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldCheck class="size-3.5 text-primary" /> Admin Accounts (Full Access)
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="acc in adminAccounts"
                :key="acc.id"
                type="button"
                class="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 hover:bg-accent hover:border-primary/50 transition-all text-left group"
                @click="handleQuickLogin(acc)"
                title="Click to sign in instantly"
              >
                <div class="min-w-0 pr-2">
                  <p class="text-xs font-bold text-foreground truncate">{{ acc.displayName }}</p>
                  <p class="text-[10px] text-muted-foreground truncate">User: {{ acc.username }}</p>
                </div>
                <ArrowRight class="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          <!-- Employees Section -->
          <div>
            <p class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <HardHat class="size-3.5 text-emerald-600 dark:text-emerald-400" /> Field Employee Accounts (My Files Access)
            </p>
            <div class="grid grid-cols-1 gap-1.5">
              <button
                v-for="acc in employeeAccounts"
                :key="acc.id"
                type="button"
                class="flex items-center justify-between p-2 rounded-lg border bg-muted/40 hover:bg-accent hover:border-emerald-500/50 transition-all text-left group"
                @click="handleQuickLogin(acc)"
                title="Click to sign in instantly"
              >
                <div class="min-w-0 pr-2 flex items-center gap-2">
                  <div class="size-6 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {{ acc.displayName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-xs font-bold text-foreground truncate">{{ acc.displayName }}</p>
                    <p class="text-[10px] text-muted-foreground truncate">{{ acc.position }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-muted-foreground hidden sm:inline font-mono">1-click login</span>
                  <ArrowRight class="size-3 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col gap-2 pt-0 pb-6 text-center border-t border-border/50 mt-2">
        <p class="text-xs text-muted-foreground pt-4">
          Need a new field personnel account?
          <button
            type="button"
            class="text-primary font-semibold hover:underline ml-1"
            @click="router.push('/register')"
          >
            Register Employee
          </button>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
