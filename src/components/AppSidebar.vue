<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  FolderTree,
  MessageSquare,
  History,
  Settings,
  User,
  FolderSync,
} from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { currentUser, isAdmin } = useAuth()

interface NavItem {
  title: string
  url: string
  icon: any
}

// Admin Navigation Menu
const adminNavItems = computed<NavItem[]>(() => [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Field Manager',
    url: '/field-manager',
    icon: Users,
  },
  {
    title: 'Shared Documents',
    url: '/shared-documents',
    icon: FolderSync,
  },
  {
    title: 'Activity Trail',
    url: '/admin/activity',
    icon: History,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
  },
])

// Employee Navigation Menu
const employeeNavItems = computed<NavItem[]>(() => [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Files',
    url: '/my-files',
    icon: FolderTree,
  },
  {
    title: 'Shared Documents',
    url: '/shared-documents',
    icon: FolderSync,
  },
  {
    title: 'Comments',
    url: '/comments',
    icon: MessageSquare,
  },
  {
    title: 'Profile & Storage',
    url: '/profile',
    icon: User,
  },
])

const navItems = computed(() => (isAdmin.value ? adminNavItems.value : employeeNavItems.value))

const isCurrentRoute = (url: string) => {
  if (url === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(url)
}

const navigateTo = (url: string) => {
  router.push(url)
}
</script>

<template>
  <Sidebar class="border-r">
    <!-- Sidebar Header -->
    <SidebarHeader class="border-b px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="size-9 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-xs">
          <img src="@/assets/img/dbblogo.png" class="rounded-md" />
        </div>
        <div class="flex flex-col text-left">
          <span class="font-bold text-sm leading-tight text-foreground">DBB Connect</span>
          <span class="text-[11px] text-muted-foreground font-medium">Digital Files</span>
        </div>
      </div>
    </SidebarHeader>

    <!-- Sidebar Main Content -->
    <SidebarContent class="px-2 py-3">
      <SidebarGroup>
        <SidebarGroupLabel class="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase px-2 mb-1">
          {{ isAdmin ? 'Office Admin Workspace' : 'Field Employee Portal' }}
        </SidebarGroupLabel>
        
        <SidebarGroupContent>
          <SidebarMenu class="space-y-1">
            <SidebarMenuItem
              v-for="item in navItems"
              :key="item.title"
            >
              <SidebarMenuButton
                :is-active="isCurrentRoute(item.url)"
                class="w-full justify-start gap-2.5 text-sm py-2 px-3 rounded-lg transition-colors cursor-pointer"
                :class="[
                  isCurrentRoute(item.url)
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                ]"
                @click="navigateTo(item.url)"
              >
                <component
                  :is="item.icon"
                  :class="[
                    'size-4 shrink-0',
                    isCurrentRoute(item.url)
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  ]"
                />
                <span class="truncate">{{ item.title }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- Sidebar Footer -->
    <SidebarFooter class="border-t p-3 bg-muted/20">
      <div
        class="flex items-center gap-3 p-2 rounded-lg bg-card border cursor-pointer hover:bg-accent transition-colors"
        @click="navigateTo('/profile')"
      >
        <Avatar class="size-8 border">
          <AvatarFallback class="bg-primary/10 text-primary text-xs font-bold">
            {{ currentUser?.name.split(' ').map((n) => n[0]).join('') }}
          </AvatarFallback>
        </Avatar>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-xs font-semibold truncate leading-tight">{{ currentUser?.name }}</span>
          <span class="text-[10px] text-muted-foreground truncate">{{ currentUser?.position }}</span>
        </div>
      </div>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
