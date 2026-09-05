import { storage } from './storage'
import { DocumentService } from './DocumentService'
import { api } from './api'
import type { Document } from '@/types'

export const AssignmentService = {
  async assignDocument(documentId: string, employeeIds: string[]): Promise<Document | null> {
    const res = await api.post<Document>(`/documents/${documentId}/assign`, {
      employeeIds: Array.from(new Set(employeeIds)),
    })

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to update document assignments on server.')
    }

    await storage.put<Document>(storage.STORES.DOCUMENTS, res.data)
    return res.data
  },

  async addEmployeeToDocument(documentId: string, employeeId: string): Promise<Document | null> {
    const doc = await DocumentService.getDocumentById(documentId)
    const current = new Set(doc?.assignedTo || [])
    current.add(employeeId)
    return await this.assignDocument(documentId, Array.from(current))
  },

  async removeEmployeeFromDocument(documentId: string, employeeId: string): Promise<Document | null> {
    const doc = await DocumentService.getDocumentById(documentId)
    const current = (doc?.assignedTo || []).filter((id) => id !== employeeId)
    return await this.assignDocument(documentId, current)
  },
}
