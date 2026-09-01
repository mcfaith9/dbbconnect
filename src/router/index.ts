import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/auth/SignupView.vue'),
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardView.vue'),
  },
  // Admin Field Manager Routes
  {
    path: '/field-manager',
    name: 'FieldManager',
    component: () => import('@/pages/FieldManagerView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/field-manager/:employeeId',
    name: 'FieldManagerEmployee',
    component: () => import('@/pages/FieldManagerView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/field-manager/:employeeId/:folderId',
    name: 'FieldManagerFolder',
    component: () => import('@/pages/FieldManagerView.vue'),
    meta: { requiresAdmin: true },
  },
  // Shared Documents (accessible by both Admin & Employee)
  {
    path: '/shared-documents',
    name: 'SharedDocuments',
    component: () => import('@/pages/SharedDocumentsView.vue'),
  },
  {
    path: '/shared-documents/:folderId',
    name: 'SharedDocumentsFolder',
    component: () => import('@/pages/SharedDocumentsView.vue'),
  },
  // Employee My Files Routes
  {
    path: '/my-files',
    name: 'MyFiles',
    component: () => import('@/pages/MyFilesView.vue'),
  },
  {
    path: '/my-files/:folderId',
    name: 'MyFilesFolder',
    component: () => import('@/pages/MyFilesView.vue'),
  },
  // Discussions & Comments
  {
    path: '/comments',
    name: 'Comments',
    component: () => import('@/pages/CommentsView.vue'),
  },
  // User Profile & Offline Diagnostics
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfileView.vue'),
  },
  // Admin Management
  {
    path: '/admin/activity',
    name: 'AdminActivity',
    component: () => import('@/pages/admin/ActivityView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('@/pages/admin/SettingsView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Role-based Navigation Guard
router.beforeEach((to, _from, next) => {
  const { isAuthenticated, isAdmin } = useAuth()

  // 1. If public route (e.g. /login, /register)
  if (to.meta.public) {
    if (isAuthenticated.value) {
      // If already logged in, redirect to role home
      next(isAdmin.value ? '/field-manager' : '/my-files')
      return
    }
    next()
    return
  }

  // 2. If not authenticated, redirect to /login
  if (!isAuthenticated.value) {
    next({
      path: '/login',
      query: to.fullPath && to.fullPath !== '/' && to.fullPath !== '/dashboard' ? { redirect: to.fullPath } : undefined,
    })
    return
  }

  // 3. Guard admin routes against employee access
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next('/my-files')
    return
  }

  next()
})
