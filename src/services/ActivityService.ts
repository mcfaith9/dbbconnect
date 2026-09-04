import { storage } from './storage'
import { api } from './api'
import type { ActivityLog, User } from '@/types'

export const ActivityService = {
  async getAllActivities(): Promise<ActivityLog[]> {
    try {
      const isOnline = await api.checkHealth()
      if (isOnline) {
        const res = await api.get<ActivityLog[]>('/activities')
        if (res.success && Array.isArray(res.data)) {
          for (const act of res.data) {
            await storage.put<ActivityLog>(storage.STORES.ACTIVITIES, act)
          }
        }
      }
    } catch {
      // Local fallback
    }
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

    const saved = await storage.put<ActivityLog>(storage.STORES.ACTIVITIES, newLog)
    api.post('/activities', {
      type: newLog.type,
      actionTitle: newLog.actionTitle,
      description: newLog.description,
      targetName: newLog.targetName,
      targetId: newLog.targetId,
      employeeName: newLog.employeeName,
    }).catch(() => {})
    return saved
  },
}
