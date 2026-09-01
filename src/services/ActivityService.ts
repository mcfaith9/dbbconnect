import { storage } from './storage'
import type { ActivityLog, User } from '@/types'

export const ActivityService = {
  async getAllActivities(): Promise<ActivityLog[]> {
    const all = await storage.getAll<ActivityLog>(storage.STORES.ACTIVITIES)
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async logActivity(params: {
    user: User
    type: ActivityLog['type']
    actionTitle: string
    description: string
    targetName: string
    targetId?: string
    employeeName?: string
  }): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      type: params.type,
      actionTitle: params.actionTitle,
      description: params.description,
      targetName: params.targetName,
      targetId: params.targetId,
      employeeName: params.employeeName,
      timestamp: new Date().toISOString(),
    }

    return await storage.put<ActivityLog>(storage.STORES.ACTIVITIES, newLog)
  },
}
