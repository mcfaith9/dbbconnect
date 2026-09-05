import { ref, computed } from 'vue'
import { UserService } from '@/services/UserService'
import { storage, INITIAL_USERS } from '@/services/storage'
import { AuthService, TEST_ACCOUNTS } from '@/services/auth/authService'
import type { User, UserRole, AuthUser } from '@/types'

// Initialize from stored session if present
const storedSession = AuthService.getSession()
const currentUser = ref<AuthUser | User | null>(storedSession)
const allUsers = ref<User[]>(INITIAL_USERS)
const isAuthenticated = computed(() => !!currentUser.value)
const isInitialized = ref(false)

export function useAuth() {
  async function initAuth() {
    if (isInitialized.value) return
    try {
      await storage.init()
      const users = await UserService.getAllUsers()
      if (users.length > 0) {
        allUsers.value = users
      }

      // Check if stored session user still exists or refresh profile
      const sessionUser = AuthService.getSession()
      if (sessionUser) {
        const found = allUsers.value.find((u) => u.id === sessionUser.id)
        if (found) {
          currentUser.value = {
            ...sessionUser,
            ...found,
            username: sessionUser.username || found.username || found.name,
            displayName: sessionUser.displayName || found.displayName || found.name,
          }
        } else {
          currentUser.value = sessionUser
        }
      }
    } catch (e) {
      console.warn('Auth init error', e)
    } finally {
      isInitialized.value = true
    }
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isEmployee = computed(() => currentUser.value?.role === 'employee')
  const userRole = computed<UserRole | null>(() => currentUser.value?.role || null)
  const username = computed(() => currentUser.value?.username || currentUser.value?.name || '')
  const displayName = computed(() => currentUser.value?.displayName || currentUser.value?.name || '')

  async function loginAs(user: User | AuthUser) {
    const authUser = AuthService.loginAs(user)
    currentUser.value = authUser
    return authUser
  }

  async function login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const result = await AuthService.login(usernameInput, passwordInput)
    if (result.success && result.user) {
      currentUser.value = result.user
      return { success: true, user: result.user }
    }
    return { success: false, error: result.error || 'Invalid credentials' }
  }

  async function register(
    name: string,
    email: string,
    role: UserRole = 'employee',
    position = 'Field Engineer',
    password = 'password'
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const result = await AuthService.register(name, email, role, position, password)
    if (result.success && result.user) {
      currentUser.value = result.user
      const users = await UserService.getAllUsers()
      allUsers.value = users
    }
    return result
  }

  function logout() {
    AuthService.clearSession()
    currentUser.value = null
  }

  return {
    currentUser,
    allUsers,
    isAuthenticated,
    isAdmin,
    isEmployee,
    userRole,
    username,
    displayName,
    testAccounts: TEST_ACCOUNTS,
    initAuth,
    loginAs,
    login,
    register,
    logout,
    getTestAccounts: AuthService.getTestAccounts,
  }
}
