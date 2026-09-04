import type { AuthUser, User, UserRole } from '@/types'
import { UserService } from '@/services/UserService'
import { storage } from '@/services/storage'
import { api } from '@/services/api'

const AUTH_STORAGE_KEY = 'dbb_fieldhub_auth_session'

export interface TestAccountDefinition {
  id: string
  username: string
  password: string
  displayName: string
  name: string
  email: string
  role: UserRole
  position: string
  department: string
  phone?: string
  assignedProject?: string
}

export const TEST_ACCOUNTS: TestAccountDefinition[] = [
  {
    id: 'admin-001',
    username: 'dmbbadmin',
    password: 'ilovedbb',
    displayName: 'DMBB Administrator',
    name: 'DMBB Administrator',
    email: 'dmbbadmin@dbb.com',
    role: 'admin',
    position: 'Office Document Administrator',
    department: 'Executive Management & Operations',
    phone: '+63 917 111 2233',
  },
  {
    id: 'admin-002',
    username: 'dbbadmin',
    password: 'ilovedbb',
    displayName: 'DBB Administrator',
    name: 'DBB Administrator',
    email: 'dbbadmin@dbb.com',
    role: 'admin',
    position: 'Head Field Administrator',
    department: 'Field Management & Operations',
    phone: '+63 917 222 3344',
  },
  {
    id: 'employee-001',
    username: 'Marc Louie Cabigas',
    password: 'ilovedbb',
    displayName: 'Marc Louie Cabigas',
    name: 'Marc Louie Cabigas',
    email: 'marc.cabigas@dbb.com',
    role: 'employee',
    position: 'Lead Field Engineer',
    department: 'Naga Project Team',
    phone: '+63 918 100 2001',
    assignedProject: 'Naga Project Phase 2',
  },
  {
    id: 'employee-002',
    username: 'Juan Dela Cruz',
    password: 'ilovedbb',
    displayName: 'Juan Dela Cruz',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@dbb.com',
    role: 'employee',
    position: 'Senior Field Engineer',
    department: 'Naga Project Team',
    phone: '+63 918 234 5678',
    assignedProject: 'Naga Project Phase 2',
  },
  {
    id: 'employee-003',
    username: 'Pedro Santos',
    password: 'ilovedbb',
    displayName: 'Pedro Santos',
    name: 'Pedro Santos',
    email: 'pedro.santos@dbb.com',
    role: 'employee',
    position: 'Site Safety Officer',
    department: 'Cebu Commercial Port',
    phone: '+63 920 345 6789',
    assignedProject: 'Cebu Project',
  },
]

export interface AuthSession {
  user: AuthUser
  token: string
  createdAt: number
}

/**
 * Authentication Service
 * Currently integrates with local test accounts and localStorage session persistence.
 * Structured cleanly so it can be swapped to Laravel API backend in future production phases.
 */
export const AuthService = {
  /**
   * Retrieves the current stored session from localStorage
   */
  getSession(): AuthUser | null {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const session: AuthSession = JSON.parse(raw)
      if (session && session.user && session.user.id && session.user.role) {
        return session.user
      }
      return null
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage', e)
      return null
    }
  },

  /**
   * Saves the authenticated session to localStorage
   */
  saveSession(user: AuthUser, token = 'mock-jwt-fieldhub-token'): void {
    if (typeof window === 'undefined') return
    const session: AuthSession = {
      user,
      token,
      createdAt: Date.now(),
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  },

  /**
   * Clears the current authenticated session
   */
  async clearSession(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      if (api.getToken()) {
        await api.post('/logout')
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      api.clearToken()
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  },

  /**
   * Authenticate against Laravel Sanctum API, with local test accounts & IndexedDB fallback
   */
  async login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanUser = usernameInput.trim()
    const cleanPass = passwordInput.trim()

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both username and password' }
    }

    // Attempt Laravel Sanctum API authentication first
    try {
      const apiRes = await api.post('/login', {
        username: cleanUser,
        password: cleanPass,
      })

      if (apiRes.success && apiRes.user && apiRes.token) {
        api.setToken(apiRes.token)
        const authUser: AuthUser = {
          id: apiRes.user.id,
          username: apiRes.user.username || apiRes.user.name,
          displayName: apiRes.user.displayName || apiRes.user.name,
          name: apiRes.user.name,
          email: apiRes.user.email,
          role: apiRes.user.role,
          position: apiRes.user.position || 'Field Personnel',
          department: apiRes.user.department || 'Field Operations',
          phone: apiRes.user.phone,
          assignedProject: apiRes.user.assignedProject,
          avatar: apiRes.user.avatar,
        }
        this.saveSession(authUser, apiRes.token)
        return { success: true, user: authUser }
      }
    } catch (e) {
      console.warn('Backend API login request encountered error, trying local fallback...', e)
    }

    // Fallback 1: Check official test accounts
    const lowerUser = cleanUser.toLowerCase()
    const matchedTest = TEST_ACCOUNTS.find((acc) => {
      const matchUsername = acc.username.toLowerCase() === lowerUser
      const matchDisplayName = acc.displayName.toLowerCase() === lowerUser
      const matchName = acc.name.toLowerCase() === lowerUser
      const matchEmail = acc.email.toLowerCase() === lowerUser
      return matchUsername || matchDisplayName || matchName || matchEmail
    })

    if (matchedTest) {
      if (matchedTest.password === cleanPass) {
        const authUser: AuthUser = {
          id: matchedTest.id,
          username: matchedTest.username,
          displayName: matchedTest.displayName,
          name: matchedTest.name,
          email: matchedTest.email,
          role: matchedTest.role,
          position: matchedTest.position,
          department: matchedTest.department,
          phone: matchedTest.phone,
          assignedProject: matchedTest.assignedProject,
        }
        this.saveSession(authUser)
        return { success: true, user: authUser }
      } else {
        return { success: false, error: 'Invalid username or password' }
      }
    }

    // Fallback 2: Check IndexedDB registered users
    try {
      const allUsers = await UserService.getAllUsers()
      const foundUser = allUsers.find(
        (u) =>
          (u.username && u.username.toLowerCase() === lowerUser) ||
          u.name.toLowerCase() === lowerUser ||
          u.email.toLowerCase() === lowerUser
      )

      if (foundUser) {
        if (cleanPass === 'ilovedbb' || cleanPass === 'password' || cleanPass.length >= 4) {
          const authUser: AuthUser = {
            id: foundUser.id,
            username: foundUser.username || foundUser.name,
            displayName: foundUser.displayName || foundUser.name,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            position: foundUser.position,
            department: foundUser.department,
            phone: foundUser.phone,
            assignedProject: foundUser.assignedProject,
          }
          this.saveSession(authUser)
          return { success: true, user: authUser }
        } else {
          return { success: false, error: 'Invalid username or password' }
        }
      }
    } catch (e) {
      console.error('Error during fallback user lookup', e)
    }

    return { success: false, error: 'Invalid username or password' }
  },

  /**
   * Fast 1-click login for test account demo switcher
   */
  loginAs(user: User | AuthUser): AuthUser {
    const authUser: AuthUser = {
      id: user.id,
      username: user.username || user.name,
      displayName: user.displayName || user.name,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      department: user.department,
      phone: user.phone,
      assignedProject: user.assignedProject,
    }
    this.saveSession(authUser)
    return authUser
  },

  /**
   * Register new user (defaults strictly to employee role)
   */
  async register(
    name: string,
    email: string,
    _role: UserRole = 'employee',
    position = 'Field Engineer'
  ): Promise<{ success: boolean; user: AuthUser; error?: string }> {
    // Attempt Laravel API registration first
    try {
      const apiRes = await api.post('/register', {
        name,
        email,
        position,
        department: 'Field Operations',
      })

      if (apiRes.success && apiRes.user && apiRes.token) {
        api.setToken(apiRes.token)
        const authUser: AuthUser = {
          id: apiRes.user.id,
          username: apiRes.user.username || apiRes.user.name,
          displayName: apiRes.user.displayName || apiRes.user.name,
          name: apiRes.user.name,
          email: apiRes.user.email,
          role: apiRes.user.role,
          position: apiRes.user.position || position,
          department: apiRes.user.department || 'Field Operations',
          phone: apiRes.user.phone,
          assignedProject: apiRes.user.assignedProject,
        }
        this.saveSession(authUser, apiRes.token)
        // Also sync to local storage for offline continuity
        await storage.init()
        await UserService.updateUser({
          ...authUser,
        })
        return { success: true, user: authUser }
      }
    } catch (e) {
      console.warn('Backend registration failed, using local registration fallback...', e)
    }

    // Fallback: Local IndexedDB registration
    const newId = `employee-${Date.now()}`
    const newUser: User = {
      id: newId,
      name,
      displayName: name,
      username: name,
      email,
      role: 'employee', // strictly default to employee for public registrations
      position,
      department: 'Field Operations',
    }

    await storage.init()
    await UserService.updateUser(newUser)

    const authUser: AuthUser = {
      id: newUser.id,
      username: newUser.name,
      displayName: newUser.name,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      position: newUser.position || 'Field Engineer',
      department: newUser.department || 'Field Operations',
    }
    this.saveSession(authUser)
    return { success: true, user: authUser }
  },

  getTestAccounts(): TestAccountDefinition[] {
    return TEST_ACCOUNTS
  },
}
