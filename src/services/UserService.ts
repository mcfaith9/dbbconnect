import { storage } from './storage'
import { api } from './api'
import type { User } from '@/types'

export const UserService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const isOnline = await api.checkHealth()
      if (isOnline) {
        const res = await api.get<User[]>('/users')
        if (res.success && Array.isArray(res.data)) {
          for (const u of res.data) {
            await storage.put<User>(storage.STORES.USERS, u)
          }
        }
      }
    } catch {
      // Local fallback
    }
    return await storage.getAll<User>(storage.STORES.USERS)
  },

  async getFieldEmployees(): Promise<User[]> {
    const all = await this.getAllUsers()
    return all.filter((u) => u.role === 'employee')
  },

  async getUserById(id: string): Promise<User | null> {
    return await storage.getById<User>(storage.STORES.USERS, id)
  },

  async updateUser(user: User): Promise<User> {
    const saved = await storage.put<User>(storage.STORES.USERS, user)
    api.put(`/users/${user.id}`, {
      name: user.name,
      email: user.email,
      position: user.position,
      department: user.department,
      phone: user.phone,
      assigned_project: user.assignedProject,
      avatar: user.avatar,
    }).catch(() => {})
    return saved
  },
}
