import { ref, computed } from 'vue'
import { UserService } from '@/services/UserService'
import { storage, INITIAL_USERS } from '@/services/storage'
import type { User, UserRole } from '@/types'

const currentUser = ref<User>(INITIAL_USERS[0]) // Default to Maria Clara (Admin)
const allUsers = ref<User[]>(INITIAL_USERS)
const isAuthenticated = ref(true)
const isInitialized = ref(false)

export function useAuth() {
  async function initAuth() {
    if (isInitialized.value) return
    try {
      await storage.init()
      const users = await UserService.getAllUsers()
      if (users.length > 0) {
        allUsers.value = users
        // Keep current selected user if existing
        const found = users.find((u) => u.id === currentUser.value?.id)
        if (found) {
          currentUser.value = found
        } else {
          currentUser.value = users[0]
        }
      }
    } catch (e) {
      console.warn('Auth init using fallback users', e)
    } finally {
      isInitialized.value = true
    }
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isEmployee = computed(() => currentUser.value?.role === 'employee')

  async function loginAs(user: User) {
    currentUser.value = user
    isAuthenticated.value = true
  }

  async function login(email: string, _password?: string): Promise<boolean> {
    const user = allUsers.value.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      currentUser.value = user
      isAuthenticated.value = true
      return true
    }
    return false
  }

  async function register(name: string, email: string, role: UserRole = 'employee', position = 'Field Engineer'): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      position,
      department: 'Field Operations',
    }
    await UserService.updateUser(newUser)
    allUsers.value.push(newUser)
    currentUser.value = newUser
    isAuthenticated.value = true
    return newUser
  }

  function logout() {
    // For convenience in testing, reset to default admin
    currentUser.value = INITIAL_USERS[0]
  }

  return {
    currentUser,
    allUsers,
    isAuthenticated,
    isAdmin,
    isEmployee,
    initAuth,
    loginAs,
    login,
    register,
    logout,
  }
}
