<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const name = ref('')
const email = ref('')
const position = ref('Field Engineer')
const role = ref<'employee' | 'admin'>('employee')

const handleRegister = async () => {
  if (!name.value || !email.value) return
  await register(name.value, email.value, role.value, position.value)
  router.push(role.value === 'admin' ? '/field-manager' : '/my-files')
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
            Create a new user account for DBB Connect.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <form @submit.prevent="handleRegister" class="space-y-3">
          <div class="space-y-1.5">
            <Label for="reg-name">Full Name</Label>
            <Input id="reg-name" v-model="name" placeholder="e.g. Roberto Gomez" required />
          </div>
          <div class="space-y-1.5">
            <Label for="reg-email">Email Address</Label>
            <Input id="reg-email" type="email" v-model="email" placeholder="roberto@dbb.com" required />
          </div>
          <div class="space-y-1.5">
            <Label for="reg-pos">Position / Role Title</Label>
            <Input id="reg-pos" v-model="position" placeholder="e.g. Safety Inspector" required />
          </div>

          <Button type="submit" class="w-full mt-2">
            Create Account &amp; Sign In
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
