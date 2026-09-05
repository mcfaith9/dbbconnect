/**
 * DBB Connect Centralized API Client
 *
 * Provides communication with the Laravel Sanctum REST API.
 * Base API URL Resolution:
 * 1. Runtime override stored in localStorage (if customized via Admin Settings)
 * 2. Vite environment variable: import.meta.env.VITE_API_URL (.env.development / .env.production)
 * 3. Safe fallback: empty string (enables graceful local offline storage mode)
 *
 * All requests authenticate using Laravel Sanctum Personal Access Tokens:
 * Authorization: Bearer <token>
 */

const DEFAULT_API_URL = ''
const TOKEN_STORAGE_KEY = 'dbb_connect_api_token'
const CUSTOM_API_URL_STORAGE_KEY = 'dbb_connect_custom_api_url'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  token?: string
  user?: any
  isOffline?: boolean
  error?: string
}

class ApiClient {
  private baseUrl: string
  private isServerOnline: boolean | null = null
  private lastHealthCheck: number = 0

  constructor() {
    const savedCustomUrl = typeof window !== 'undefined' ? window.localStorage.getItem(CUSTOM_API_URL_STORAGE_KEY) : null
    const envUrl = (import.meta.env.VITE_API_URL as string | undefined) || ''
    this.baseUrl = this.normalizeUrl(savedCustomUrl || envUrl || DEFAULT_API_URL)
  }

  private normalizeUrl(url: string): string {
    let clean = (url || '').trim().replace(/\/+$/, '')
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4).replace(/\/+$/, '')
    }
    return clean
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  public getApiBaseUrl(): string {
    return this.baseUrl ? `${this.baseUrl}/api` : ''
  }

  public setBaseUrl(url: string, persist = false): void {
    this.baseUrl = this.normalizeUrl(url)
    this.isServerOnline = null
    if (persist && typeof window !== 'undefined') {
      if (this.baseUrl) {
        window.localStorage.setItem(CUSTOM_API_URL_STORAGE_KEY, this.baseUrl)
      } else {
        window.localStorage.removeItem(CUSTOM_API_URL_STORAGE_KEY)
      }
    }
  }

  public resetBaseUrl(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CUSTOM_API_URL_STORAGE_KEY)
    }
    const envUrl = (import.meta.env.VITE_API_URL as string | undefined) || ''
    this.baseUrl = this.normalizeUrl(envUrl)
    this.isServerOnline = null
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }

  public clearToken(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  /**
   * Fast health check to verify if the Laravel backend is reachable
   */
  public async checkHealth(force = false): Promise<boolean> {
    if (!this.baseUrl) {
      this.isServerOnline = false
      return false
    }

    const now = Date.now()
    if (!force && this.isServerOnline !== null && now - this.lastHealthCheck < 15000) {
      return this.isServerOnline
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout

      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      this.isServerOnline = res.ok
      this.lastHealthCheck = now
      return res.ok
    } catch {
      this.isServerOnline = false
      this.lastHealthCheck = now
      return false
    }
  }

  /**
   * Generic request handler with Sanctum Bearer token authorization
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl) {
      return {
        success: false,
        isOffline: true,
        error: 'Backend API offline or not configured. Using local storage.',
      }
    }

    const token = this.getToken()
    const url = `${this.baseUrl}/api/${endpoint.replace(/^\//, '')}`

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Include Bearer token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // If body is NOT FormData, set JSON content-type
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let json: any = {}
      try {
        json = await response.json()
      } catch {
        json = {}
      }

      if (!response.ok) {
        let errMsg = json.message || `Server returned ${response.status}: ${response.statusText}`
        if (json.errors && typeof json.errors === 'object') {
          const firstErrorList = Object.values(json.errors)[0] as any
          if (Array.isArray(firstErrorList) && firstErrorList.length > 0) {
            errMsg = firstErrorList[0]
          }
        }
        return {
          success: false,
          error: errMsg,
          data: json.data,
        }
      }

      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
        message: json.message,
        token: json.token,
        user: json.user,
      }
    } catch (err: any) {
      // Offline / Unreachable backend
      return {
        success: false,
        isOffline: true,
        error: err.name === 'AbortError' ? 'API request timed out.' : 'Unable to connect to Laravel backend.',
      }
    }
  }

  public async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const query = new URLSearchParams()
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null) {
          query.append(key, String(val))
        }
      }
      const qs = query.toString()
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs
      }
    }
    return this.request<T>(url, { method: 'GET' })
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
