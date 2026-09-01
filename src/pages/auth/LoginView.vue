<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, HardHat, ArrowRight, Lock, User as UserIcon, AlertCircle, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, loginAs, getTestAccounts, initAuth } = useAuth()

const username = ref('dmbbadmin')
const password = ref('ilovedbb')
const isLoading = ref(false)
const errorMessage = ref('')
const testAccounts = ref(getTestAccounts())

onMounted(async () => {
  await initAuth()
  testAccounts.value = getTestAccounts()
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
  } catch (e) {
    errorMessage.value = 'An error occurred during login. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleQuickLogin = async (account: any) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const user = await loginAs(account)
    const redirectTarget = (route.query.redirect as string) || (user.role === 'admin' ? '/field-manager' : '/my-files')
    router.push(redirectTarget)
  } catch (e) {
    errorMessage.value = 'Quick login failed. Please try manual login.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted/40 relative">
    <Card class="w-full max-w-lg shadow-xl border bg-card/95 backdrop-blur">
      <CardHeader class="space-y-2 text-center pb-4 pt-6">
        <div class="size-14 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center mx-auto shadow-md ring-4 ring-primary/10">
          FH
        </div>
        <div>
          <CardTitle class="text-2xl font-bold tracking-tight text-foreground">DBB Connect</CardTitle>
          <CardDescription class="text-xs text-muted-foreground mt-1">
            Digital Field File Management &amp; Offline Document Access
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-5 px-6">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="flex items-center gap-2 p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in duration-200"
        >
          <AlertCircle class="size-4 shrink-0" />
          <span>{{ errorMessage }}</span>
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
                placeholder="e.g. dmbbadmin or Marc Louie Cabigas"
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
