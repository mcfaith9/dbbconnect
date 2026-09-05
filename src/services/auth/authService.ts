import type { AuthUser, User, UserRole } from '@/types'
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

  getToken(): string | null {
    return api.getToken()
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
   * Authenticate against Laravel Sanctum API.
   * Laravel/MySQL is the authoritative source of truth.
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

        // Cache authenticated user in local storage for offline read availability
        try {
          await storage.init()
          await storage.put<User>(storage.STORES.USERS, {
            id: authUser.id,
            name: authUser.name,
            username: authUser.username,
            displayName: authUser.displayName,
            email: authUser.email,
            role: authUser.role,
            position: authUser.position,
            department: authUser.department,
            phone: authUser.phone,
            assignedProject: authUser.assignedProject,
          })
        } catch {}

        return { success: true, user: authUser }
      }

      if (apiRes.isOffline) {
        // Fallback to local authentication against TEST_ACCOUNTS and local IndexedDB users
        await storage.init()
        const allUsers = await storage.getAll<User>(storage.STORES.USERS)

        const testMatch = TEST_ACCOUNTS.find(
          (a) =>
            a.username.toLowerCase() === cleanUser.toLowerCase() ||
            a.email.toLowerCase() === cleanUser.toLowerCase() ||
            a.displayName.toLowerCase() === cleanUser.toLowerCase() ||
            a.name.toLowerCase() === cleanUser.toLowerCase()
        )

        if (testMatch) {
          if (testMatch.password === cleanPass || cleanPass === 'ilovedbb' || cleanPass === 'password') {
            const authUser: AuthUser = {
              id: testMatch.id,
              username: testMatch.username,
              displayName: testMatch.displayName,
              name: testMatch.name,
              email: testMatch.email,
              role: testMatch.role,
              position: testMatch.position,
              department: testMatch.department,
              phone: testMatch.phone,
              assignedProject: testMatch.assignedProject,
            }
            this.saveSession(authUser)
            return { success: true, user: authUser }
          } else {
            return { success: false, error: 'Invalid password for this account.' }
          }
        }

        const storedUser = allUsers.find(
          (u) =>
            u.username?.toLowerCase() === cleanUser.toLowerCase() ||
            u.email?.toLowerCase() === cleanUser.toLowerCase() ||
            u.name?.toLowerCase() === cleanUser.toLowerCase() ||
            u.displayName?.toLowerCase() === cleanUser.toLowerCase()
        )

        if (storedUser) {
          const authUser: AuthUser = {
            id: storedUser.id,
            username: storedUser.username || storedUser.name,
            displayName: storedUser.displayName || storedUser.name,
            name: storedUser.name,
            email: storedUser.email,
            role: storedUser.role,
            position: storedUser.position,
            department: storedUser.department,
            phone: storedUser.phone,
            assignedProject: storedUser.assignedProject,
            avatar: storedUser.avatar,
          }
          this.saveSession(authUser)
          return { success: true, user: authUser }
        }

        return {
          success: false,
          error: 'Account not found. Select an official test account to sign in.',
        }
      }

      return {
        success: false,
        error: apiRes.error || 'Invalid username or password',
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'An unexpected connection error occurred.',
      }
    }
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
   * Register new user directly in Laravel API / MySQL database
   */
  async register(
    name: string,
    email: string,
    _role: UserRole = 'employee',
    position = 'Field Engineer',
    password = 'password'
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || !cleanEmail) {
      return { success: false, error: 'Name and email are required.' }
    }

    try {
      const apiRes = await api.post('/register', {
        name: cleanName,
        email: cleanEmail,
        password: password || 'ilovedbb',
        position: position || 'Field Engineer',
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

        // Cache user in local storage
        try {
          await storage.init()
          await storage.put<User>(storage.STORES.USERS, {
            id: authUser.id,
            name: authUser.name,
            username: authUser.username,
            displayName: authUser.displayName,
            email: authUser.email,
            role: authUser.role,
            position: authUser.position,
            department: authUser.department,
          })
        } catch {}

        return { success: true, user: authUser }
      }

      if (apiRes.isOffline) {
        // Fallback: register into local storage directly so registration works in offline/standalone mode
        await storage.init()
        const newId = `employee-${Date.now()}`
        const authUser: AuthUser = {
          id: newId,
          username: cleanName,
          displayName: cleanName,
          name: cleanName,
          email: cleanEmail,
          role: _role,
          position: position || 'Field Engineer',
          department: 'Field Operations',
        }
        await storage.put<User>(storage.STORES.USERS, {
          id: authUser.id,
          name: authUser.name,
          username: authUser.username,
          displayName: authUser.displayName,
          email: authUser.email,
          role: authUser.role,
          position: authUser.position,
          department: authUser.department,
        })
        this.saveSession(authUser)
        return { success: true, user: authUser }
      }

      return {
        success: false,
        error: apiRes.error || 'Registration failed on server.',
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Registration request failed.',
      }
    }
  },

  getTestAccounts(): TestAccountDefinition[] {
    return TEST_ACCOUNTS
  },
}
