import type { AuthUser, User, UserRole } from '@/types'
import { UserService } from '@/services/UserService'
import { storage } from '@/services/storage'

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
  clearSession(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  },

  /**
   * Authenticate against local test accounts & registered users
   */
  async login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanUser = usernameInput.trim().toLowerCase()
    const cleanPass = passwordInput.trim()

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both username and password' }
    }

    // 1. Check official test accounts
    const matchedTest = TEST_ACCOUNTS.find((acc) => {
      const matchUsername = acc.username.toLowerCase() === cleanUser
      const matchDisplayName = acc.displayName.toLowerCase() === cleanUser
      const matchName = acc.name.toLowerCase() === cleanUser
      const matchEmail = acc.email.toLowerCase() === cleanUser
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

    // 2. Check IndexedDB registered users (mock fallback for users registered via SignupView)
    try {
      const allUsers = await UserService.getAllUsers()
      const foundUser = allUsers.find(
        (u) =>
          (u.username && u.username.toLowerCase() === cleanUser) ||
          u.name.toLowerCase() === cleanUser ||
          u.email.toLowerCase() === cleanUser
      )

      if (foundUser) {
        // Registered demo accounts accept 'ilovedbb' or 'password'
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
  ): Promise<{ success: boolean; user: AuthUser }> {
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
