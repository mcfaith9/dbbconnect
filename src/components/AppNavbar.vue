<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
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

const router = useRouter()
const { currentUser, isAdmin, logout } = useAuth()
const {
  effectiveOnline,
  isSimulatedOffline,
  isSyncing,
  pendingCount,
  syncMessage,
  triggerSync,
  toggleSimulatedOffline,
} = useOfflineSync()

const isDark = ref(
  typeof document !== 'undefined' &&
    (localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      document.documentElement.classList.contains('dark')),
)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-xs px-3 sm:px-4">
    <!-- Left: Sidebar toggle and Brand title -->
    <div class="flex items-center gap-2 sm:gap-3">
      <SidebarTrigger class="-ml-1" />
      <div class="flex items-center gap-2">
        <span class="font-bold text-sm sm:text-base tracking-tight text-foreground flex items-center gap-1.5">
          <span class="size-6 rounded bg-primary text-primary-foreground font-black text-[10px] flex items-center justify-center">
            DBB
          </span>
          <span>DBB Connect</span>
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

    <!-- Right: Theme Switcher & User Profile Menu -->
    <div class="flex items-center gap-1.5 sm:gap-2">
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
                {{ currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('') : 'U' }}
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
          <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click="handleLogout">
            <LogOut class="size-4 mr-2" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
