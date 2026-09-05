<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  UsersRound,
  FolderTree,
  FileText,
  Clock,
  HardDriveDownload,
  Upload,
  ArrowRight,
  CheckCircle2, 
  FolderSync,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserService } from '@/services/UserService'
import { DocumentService } from '@/services/DocumentService'
import { FolderService } from '@/services/FolderService'
import { ActivityService } from '@/services/ActivityService'
import { CommentService } from '@/services/CommentService'
import { useAuth } from '@/composables/useAuth'
import type { User, Document, Folder, ActivityLog, DocumentComment } from '@/types'

const router = useRouter()
const { currentUser, isAdmin } = useAuth()

const employees = ref<User[]>([])
const allDocs = ref<Document[]>([])
const allFolders = ref<Folder[]>([])
const recentActivities = ref<ActivityLog[]>([])
const recentComments = ref<DocumentComment[]>([])
const employeeDocs = ref<Document[]>([])

const isLoading = ref(true)

const loadDashboardData = async () => {
  isLoading.value = true
  try {
    employees.value = await UserService.getFieldEmployees()
    allDocs.value = await DocumentService.getAllDocuments()
    allFolders.value = await FolderService.getAllFolders()
    recentActivities.value = await ActivityService.getAllActivities()
    recentComments.value = await CommentService.getRecentComments(5)

    if (currentUser.value && currentUser.value.role === 'employee') {
      employeeDocs.value = await DocumentService.getAssignedDocumentsForEmployee(currentUser.value.id)
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboardData)

// Metrics for Admin
const totalEmployees = computed(() => employees.value.length)
const totalDocuments = computed(() => allDocs.value.length)
const totalFolders = computed(() => allFolders.value.length)
const pendingActivitiesCount = computed(() => recentActivities.value.length)

// Metrics for Employee
const myFilesCount = computed(() => employeeDocs.value.length)
const myOfflineFilesCount = computed(() => employeeDocs.value.filter((d) => d.offlineCached).length)
const myFoldersCount = computed(() => {
  if (!currentUser.value) return 0
  return allFolders.value.filter((f) => f.ownerId === currentUser.value?.id).length
})

const navigateToEmployee = (employeeId: string) => {
  router.push(`/field-manager/${employeeId}`)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Welcome Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-5 sm:p-6 shadow-xs">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {{ currentUser?.name }}
          </h1>
          <Badge :variant="isAdmin ? 'default' : 'secondary'">
            {{ isAdmin ? 'Office Admin' : 'Field Lead' }}
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground">
          {{
            isAdmin
              ? 'Manage field personnel folders, assign documents, and monitor digital field sync.'
              : `Access your field project files, offline documents, and drawings for ${currentUser?.assignedProject || 'Field Operations'}.`
          }}
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <Button
          v-if="isAdmin"
          class="gap-1.5 shadow-xs"
          @click="router.push('/field-manager')"
        >
          <UsersRound class="size-4" />
          Field Manager
        </Button>
        <Button
          v-else
          class="gap-1.5 shadow-xs"
          @click="router.push('/my-files')"
        >
          <FolderTree class="size-4" />
          Open My Files
        </Button>
        <Button
          variant="outline"
          class="gap-1.5"
          @click="router.push('/shared-documents')"
        >
          <FolderSync class="size-4" />
          Shared Docs
        </Button>
      </div>
    </div>

    <!-- ADMIN DASHBOARD CONTENT -->
    <template v-if="isAdmin">
      <!-- Admin Metric Cards Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Field Employees
            </CardTitle>
            <UsersRound class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalEmployees }}</div>
            <p class="text-xs text-muted-foreground mt-1">Active site engineers &amp; officers</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Field Documents
            </CardTitle>
            <FileText class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalDocuments }}</div>
            <p class="text-xs text-muted-foreground mt-1">Permits, drawings, &amp; safety files</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Project Folders
            </CardTitle>
            <FolderTree class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalFolders }}</div>
            <p class="text-xs text-muted-foreground mt-1">Across all field workspaces</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Logged Activities
            </CardTitle>
            <Clock class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ pendingActivitiesCount }}</div>
            <p class="text-xs text-muted-foreground mt-1">Recent uploads &amp; assignments</p>
          </CardContent>
        </Card>
      </div>

      <!-- Field Employees Quick List & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Field Manager Quick Access (2 cols) -->
        <Card class="lg:col-span-2 shadow-xs">
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-base font-bold flex items-center gap-2">
                <UsersRound class="size-4 text-primary" />
                Field Manager Workspaces
              </CardTitle>
              <CardDescription>
                Select an employee to manage their assigned folders and upload field files.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push('/field-manager')">
              View All <ArrowRight class="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="emp in employees"
              :key="emp.id"
              class="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-accent/40 transition-colors cursor-pointer"
              @click="navigateToEmployee(emp.id)"
            >
              <div class="flex items-center gap-3">
                <Avatar class="size-10 border">
                  <AvatarFallback class="bg-primary/10 text-primary font-bold text-sm">
                    {{ emp.name.split(' ').map((n) => n[0]).join('') }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 class="font-semibold text-sm leading-tight text-foreground">{{ emp.name }}</h4>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ emp.position }} &bull; {{ emp.department }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="text-right hidden sm:block">
                  <span class="text-xs font-semibold text-foreground">
                    {{ allDocs.filter((d) => d.ownerId === emp.id || d.assignedTo?.includes(emp.id)).length }} Files
                  </span>
                  <p class="text-[10px] text-muted-foreground">
                    {{ allFolders.filter((f) => f.ownerId === emp.id).length }} Folders
                  </p>
                </div>
                <Button size="sm" variant="outline" class="gap-1 text-xs">
                  <span>Open</span>
                  <ChevronRight class="size-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Field Activity Trail (1 col) -->
        <Card class="shadow-xs">
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-base font-bold flex items-center gap-2">
                <Clock class="size-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest uploads &amp; assignments</CardDescription>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="act in recentActivities.slice(0, 5)"
              :key="act.id"
              class="flex items-start gap-2.5 text-xs pb-3 border-b last:border-b-0 last:pb-0"
            >
              <div class="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Upload v-if="act.type === 'upload'" class="size-3" />
                <UsersRound v-else-if="act.type === 'assign'" class="size-3" />
                <MessageSquare v-else-if="act.type === 'comment'" class="size-3" />
                <HardDriveDownload v-else class="size-3" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-foreground truncate">{{ act.actionTitle }}</p>
                <p class="text-muted-foreground text-[11px] truncate">{{ act.description }}</p>
                <span class="text-[10px] text-muted-foreground">
                  {{ new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <!-- EMPLOYEE DASHBOARD CONTENT -->
    <template v-else>
      <!-- Employee Metric Cards Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              My Files
            </CardTitle>
            <FileText class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ myFilesCount }}</div>
            <p class="text-xs text-muted-foreground mt-1">Assigned field documents</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              My Folders
            </CardTitle>
            <FolderTree class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ myFoldersCount }}</div>
            <p class="text-xs text-muted-foreground mt-1">Project folders in workspace</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-emerald-500/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Offline
            </CardTitle>
            <HardDriveDownload class="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ myOfflineFilesCount }}</div>
            <p class="text-xs text-muted-foreground mt-1">Cached in IndexedDB storage</p>
          </CardContent>
        </Card>

        <Card class="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Project
            </CardTitle>
            <ShieldCheck class="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-base font-bold truncate">{{ currentUser?.assignedProject || 'Naga Project Phase 2' }}</div>
            <p class="text-xs text-muted-foreground mt-1">Department: {{ currentUser?.department }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Employee Assigned Documents Quick View -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card class="lg:col-span-2 shadow-xs">
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-base font-bold flex items-center gap-2">
                <FolderTree class="size-4 text-primary" />
                My Assigned Documents
              </CardTitle>
              <CardDescription>Recently updated documents for your field operations.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push('/my-files')">
              Open My Files <ArrowRight class="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent class="space-y-2.5">
            <div
              v-for="doc in employeeDocs.slice(0, 5)"
              :key="doc.id"
              class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors cursor-pointer"
              @click="router.push('/my-files')"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText class="size-4" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-medium text-xs sm:text-sm truncate text-foreground">{{ doc.name }}</h4>
                  <p class="text-[11px] text-muted-foreground truncate">
                    {{ doc.sizeFormatted }} &bull; Version {{ doc.version }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Badge
                  v-if="doc.offlineCached"
                  variant="success"
                  class="text-[10px] gap-1"
                >
                  <CheckCircle2 class="size-3" />
                  Offline
                </Badge>
                <Button size="sm" variant="ghost" class="h-7 text-xs">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Offline PWA Readiness Status -->
        <Card class="shadow-xs bg-muted/20 border">
          <CardHeader>
            <CardTitle class="text-base font-bold flex items-center gap-2">
              <HardDriveDownload class="size-4 text-emerald-600 dark:text-emerald-400" />
              Field Offline Readiness
            </CardTitle>
            <CardDescription>
              Offline file caching enables working in zero-connectivity job sites.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="p-3.5 rounded-lg border bg-card text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-medium text-muted-foreground">Cached Documents:</span>
                <span class="font-bold text-foreground">{{ myOfflineFilesCount }} of {{ myFilesCount }} files</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  class="bg-emerald-500 h-2 rounded-full transition-all"
                  :style="{ width: `${myFilesCount > 0 ? (myOfflineFilesCount / myFilesCount) * 100 : 0}%` }"
                />
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              To make documents available offline, open any file in <span class="font-semibold text-foreground">My Files</span> and click <span class="font-semibold text-foreground">Make Available Offline</span>.
            </p>

            <Button
              class="w-full gap-2 text-xs"
              variant="outline"
              @click="router.push('/my-files')"
            >
              <FolderTree class="size-3.5" />
              Browse &amp; Cache Files
            </Button>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
