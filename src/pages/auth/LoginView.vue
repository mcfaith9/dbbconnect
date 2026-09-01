<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, Users, ArrowRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { allUsers, loginAs, login } = useAuth()

const email = ref('maria.clara@dbb.com')
const password = ref('password')
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  const success = await login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  } else {
    errorMsg.value = 'User not found. Try one of the quick demo accounts below.'
  }
}

const handleQuickLogin = async (user: any) => {
  await loginAs(user)
  if (user.role === 'admin') {
    router.push('/field-manager')
  } else {
    router.push('/my-files')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted/30">
    <Card class="w-full max-w-md shadow-xl border">
      <CardHeader class="space-y-2 text-center pb-4">
        <div class="size-12 rounded-xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto shadow-md">
          FH
        </div>
        <CardTitle class="text-xl font-bold">DBB FieldHub</CardTitle>
        <CardDescription>
          Digital field file management and offline PWA for construction and field teams.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Quick Fast-Login Demo Accounts -->
        <div class="space-y-2">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Demo Logins
          </Label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="user in allUsers"
              :key="user.id"
              type="button"
              class="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-left text-xs group"
              @click="handleQuickLogin(user)"
            >
              <div class="flex items-center gap-2.5">
                <Shield v-if="user.role === 'admin'" class="size-4 text-primary shrink-0" />
                <Users v-else class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p class="font-bold text-foreground">{{ user.name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ user.position }} &bull; {{ user.role }}</p>
                </div>
              </div>
              <ArrowRight class="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </button>
          </div>
        </div>

        <div class="relative flex items-center justify-center">
          <div class="border-t w-full" />
          <span class="bg-card px-2 text-[11px] text-muted-foreground uppercase shrink-0">Or manual sign in</span>
          <div class="border-t w-full" />
        </div>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <div class="space-y-1.5">
            <Label for="login-email">Email Address</Label>
            <Input id="login-email" type="email" v-model="email" required />
          </div>
          <div class="space-y-1.5">
            <Label for="login-password">Password</Label>
            <Input id="login-password" type="password" v-model="password" required />
          </div>

          <p v-if="errorMsg" class="text-xs text-destructive font-medium">
            {{ errorMsg }}
          </p>

          <Button type="submit" class="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
