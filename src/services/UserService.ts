import { storage } from './storage'
import type { User } from '@/types'

export const UserService = {
  async getAllUsers(): Promise<User[]> {
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
    return await storage.put<User>(storage.STORES.USERS, user)
  },
}
