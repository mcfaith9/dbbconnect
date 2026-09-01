import { storage } from './storage'
import { DocumentService } from './DocumentService'
import type { Document } from '@/types'

export const AssignmentService = {
  async assignDocument(documentId: string, employeeIds: string[]): Promise<Document | null> {
    const doc = await DocumentService.getDocumentById(documentId)
    if (!doc) return null
    doc.assignedTo = Array.from(new Set(employeeIds))
    doc.updatedAt = new Date().toISOString()
    return await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
  },

  async addEmployeeToDocument(documentId: string, employeeId: string): Promise<Document | null> {
    const doc = await DocumentService.getDocumentById(documentId)
    if (!doc) return null
    const current = new Set(doc.assignedTo || [])
    current.add(employeeId)
    doc.assignedTo = Array.from(current)
    doc.updatedAt = new Date().toISOString()
    return await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
  },

  async removeEmployeeFromDocument(documentId: string, employeeId: string): Promise<Document | null> {
    const doc = await DocumentService.getDocumentById(documentId)
    if (!doc) return null
    doc.assignedTo = (doc.assignedTo || []).filter((id) => id !== employeeId)
    doc.updatedAt = new Date().toISOString()
    return await storage.put<Document>(storage.STORES.DOCUMENTS, doc)
  },
}
