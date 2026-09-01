<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Users,
  Shield,
  UserCheck,
  LogOut,
  ChevronDown,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/composables/useAuth'
import { useOfflineSync } from '@/composables/useOfflineSync'
import type { User } from '@/types'

const router = useRouter()
const { currentUser, allUsers, isAdmin, loginAs, logout } = useAuth()
const {
  effectiveOnline,
  isSimulatedOffline,
  isSyncing,
  pendingCount,
  syncMessage,
  triggerSync,
  toggleSimulatedOffline,
} = useOfflineSync()

const isDark = ref(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const handleSwitchUser = async (user: User) => {
  await loginAs(user)
  if (user.role === 'admin') {
    router.push('/field-manager')
  } else {
    router.push('/my-files')
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-xs px-3 sm:px-4">
    <!-- Left: Sidebar toggle and Brand title -->
    <div class="flex items-center gap-2 sm:gap-3">
      <SidebarTrigger class="-ml-1" />
      <div class="flex items-center gap-2">
        <span class="font-bold text-sm sm:text-base tracking-tight text-foreground flex items-center gap-1.5">
          <span class="size-6 rounded bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
            FH
          </span>
          <span>DBB FieldHub</span>
        </span>
        <Badge
          :variant="isAdmin ? 'default' : 'secondary'"
          class="text-[10px] hidden sm:inline-flex"
        >
          {{ isAdmin ? 'Admin Mode' : 'Field Employee' }}
        </Badge>
      </div>
    </div>

    <!-- Center: PWA Sync & Offline Indicator Pill -->
    <div class="flex items-center gap-2">
      <!-- Sync notification tooltip/banner if active -->
      <div
        v-if="syncMessage"
        class="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full animate-in fade-in flex items-center gap-1.5 hidden md:flex"
      >
        <RefreshCw class="size-3 animate-spin" />
        <span>{{ syncMessage }}</span>
      </div>

      <!-- Online / Offline Status Button Pill -->
      <div class="flex items-center gap-1 bg-muted/60 border rounded-full p-1 pl-2.5 text-xs">
        <div class="flex items-center gap-1.5 pr-1">
          <span
            :class="[
              'size-2 rounded-full',
              effectiveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
            ]"
          />
          <span class="font-medium hidden sm:inline">
            {{ effectiveOnline ? 'Online' : 'Offline' }}
          </span>
          <span v-if="pendingCount > 0" class="text-amber-600 dark:text-amber-400 font-semibold">
            ({{ pendingCount }} pending)
          </span>
        </div>

        <!-- Sync Now Button -->
        <Button
          v-if="effectiveOnline"
          variant="ghost"
          size="icon"
          class="size-6 rounded-full"
          :disabled="isSyncing"
          title="Synchronize data with server"
          @click="triggerSync"
        >
          <RefreshCw :class="['size-3 text-muted-foreground', isSyncing ? 'animate-spin text-primary' : '']" />
        </Button>

        <!-- Simulated Offline Toggle for Testing PWA -->
        <Button
          variant="ghost"
          size="sm"
          class="h-6 text-[10px] px-2 rounded-full"
          :title="isSimulatedOffline ? 'Click to reconnect' : 'Simulate field offline mode'"
          @click="toggleSimulatedOffline"
        >
          <WifiOff v-if="!isSimulatedOffline" class="size-3 text-muted-foreground mr-1" />
          <Wifi v-else class="size-3 text-emerald-500 mr-1" />
          <span class="hidden sm:inline">
            {{ isSimulatedOffline ? 'Reconnect' : 'Test Offline' }}
          </span>
        </Button>
      </div>
    </div>

    <!-- Right: Quick Demo User Switcher & User Profile Menu -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Fast Role Switcher Dropdown (Crucial for testing Admin vs Field Employee!) -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 text-xs gap-1.5 hidden sm:inline-flex">
            <Users class="size-3.5 text-primary" />
            <span class="font-medium truncate max-w-[100px]">{{ currentUser?.name }}</span>
            <ChevronDown class="size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-64">
          <DropdownMenuLabel class="text-xs font-semibold">
            Switch Active User / Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div class="px-2 py-1.5 text-[11px] text-muted-foreground font-medium">
            ADMINISTRATOR
          </div>
          <DropdownMenuItem
            v-for="user in allUsers.filter((u) => u.role === 'admin')"
            :key="user.id"
            :class="['gap-2 cursor-pointer', currentUser?.id === user.id ? 'bg-accent font-medium' : '']"
            @click="handleSwitchUser(user)"
          >
            <Shield class="size-4 text-primary shrink-0" />
            <div class="flex flex-col">
              <span class="text-xs">{{ user.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ user.position }}</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <div class="px-2 py-1.5 text-[11px] text-muted-foreground font-medium">
            FIELD EMPLOYEES
          </div>
          <DropdownMenuItem
            v-for="user in allUsers.filter((u) => u.role === 'employee')"
            :key="user.id"
            :class="['gap-2 cursor-pointer', currentUser?.id === user.id ? 'bg-accent font-medium' : '']"
            @click="handleSwitchUser(user)"
          >
            <UserCheck class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div class="flex flex-col">
              <span class="text-xs">{{ user.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ user.position }}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Theme Switcher -->
      <Button
        variant="ghost"
        size="icon"
        class="size-8"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        @click="toggleDarkMode"
      >
        <Sun v-if="isDark" class="size-4 text-amber-400" />
        <Moon v-else class="size-4 text-foreground" />
      </Button>

      <!-- User Avatar / Profile Dropdown -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="size-8 rounded-full border">
            <Avatar class="size-7">
              <AvatarFallback class="bg-primary/10 text-primary text-xs font-bold">
                {{ currentUser?.name.split(' ').map((n) => n[0]).join('') }}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel>
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium leading-none">{{ currentUser?.name }}</p>
              <p class="text-xs leading-none text-muted-foreground">{{ currentUser?.email }}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer" @click="router.push('/profile')">
            User Profile &amp; Storage
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isAdmin"
            class="cursor-pointer"
            @click="router.push('/admin/activity')"
          >
            Admin Activity Trail
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isAdmin"
            class="cursor-pointer"
            @click="router.push('/admin/settings')"
          >
            System Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer text-destructive" @click="logout">
            <LogOut class="size-4 mr-2" />
            <span>Reset Demo User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
