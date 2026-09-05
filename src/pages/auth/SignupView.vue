<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const position = ref('Employee')
const role = ref<'employee' | 'admin'>('employee')
const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  if (!name.value || !email.value) {
    errorMessage.value = 'Name and email are required.'
    return
  }

  isLoading.value = true
  try {
    const result = await register(
      name.value,
      email.value,
      role.value,
      position.value,
      password.value || 'ilovedbb'
    )

    if (result.success && result.user) {
      router.push(role.value === 'admin' ? '/field-manager' : '/my-files')
    } else {
      errorMessage.value = result.error || 'Registration failed. Please check your details.'
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'An error occurred during registration.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted/30">
    <Card class="w-full max-w-md border bg-card shadow-sm">
      <CardHeader class="space-y-3 text-center pb-4 pt-6">
        <div class="size-12 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center mx-auto shadow-xs overflow-hidden">
          <img src="@/assets/img/dbblogo.png" alt="DBB Connect" class="size-12 object-contain" />
        </div>
        <div>
          <CardTitle class="text-xl font-bold tracking-tight text-foreground">Register Field Personnel</CardTitle>
          <CardDescription class="text-xs text-muted-foreground mt-1">
            Create an account directly in the centralized Laravel / MySQL database.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="flex items-center gap-2 p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in duration-200"
        >
          <AlertCircle class="size-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-3">
          <div class="space-y-1.5">
            <Label for="reg-name">Full Name</Label>
            <Input id="reg-name" v-model="name" placeholder="e.g. Marc Cabigas" required />
          </div>
          <div class="space-y-1.5">
            <Label for="reg-email">Email Address</Label>
            <Input id="reg-email" type="email" v-model="email" placeholder="e.g. mcdc@dbb.com" required />
          </div>
          <div class="space-y-1.5">
            <Label for="reg-password">Password (Optional - defaults to ilovedbb)</Label>
            <Input id="reg-password" type="password" v-model="password" placeholder="At least 6 characters" />
          </div>
          <div class="space-y-1.5">
            <Label for="reg-pos">Position / Role Title</Label>
            <Input id="reg-pos" v-model="position" placeholder="e.g. Safety Inspector" required />
          </div>

          <Button type="submit" class="w-full mt-2" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="size-4 mr-2 animate-spin" />
            <span v-if="!isLoading">Create Account &amp; Sign In</span>
            <span v-else>Registering in MySQL...</span>
          </Button>

          <div class="text-center pt-2">
            <button
              type="button"
              class="text-xs text-primary hover:underline"
              @click="router.push('/login')"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
