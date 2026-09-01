<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { initAuth } = useAuth()

onMounted(async () => {
  await initAuth()
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col font-sans">
    <!-- If on standalone public auth routes (like /login or /register) -->
    <template v-if="route.meta.public">
      <router-view />
    </template>

    <!-- Main Full-Featured App Layout with Collapsible Sidebar & Navigation -->
    <template v-else>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset class="flex flex-col flex-1 min-w-0 bg-background">
          <AppNavbar />
          <main class="flex-1 flex flex-col overflow-y-auto bg-muted/15">
            <router-view />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </template>
  </div>
</template>
