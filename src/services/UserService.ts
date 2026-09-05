import { storage } from './storage'
import { api } from './api'
import type { User } from '@/types'

export const UserService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await api.get<User[]>('/users')
      if (res.success && Array.isArray(res.data)) {
        for (const u of res.data) {
          await storage.put<User>(storage.STORES.USERS, u)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for users, checking local cache:', e)
    }
    return await storage.getAll<User>(storage.STORES.USERS)
  },

  async getFieldEmployees(): Promise<User[]> {
    const all = await this.getAllUsers()
    return all.filter((u) => u.role === 'employee')
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const res = await api.get<User>(`/users/${id}`)
      if (res.success && res.data) {
        await storage.put<User>(storage.STORES.USERS, res.data)
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for single user:', e)
    }
    return await storage.getById<User>(storage.STORES.USERS, id)
  },

  async updateUser(user: User): Promise<User> {
    const res = await api.put<User>(`/users/${user.id}`, {
      name: user.name,
      email: user.email,
      position: user.position,
      department: user.department,
      phone: user.phone,
      assigned_project: user.assignedProject,
      avatar: user.avatar,
    })

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to update user profile on Laravel server.')
    }

    const saved = res.data
    await storage.put<User>(storage.STORES.USERS, saved)
    return saved
  },
}
