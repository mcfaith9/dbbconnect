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

const DEFAULT_API_URL = 'http://192.168.1.38:8000'
const TOKEN_STORAGE_KEY = 'dbb_connect_api_token'
const CUSTOM_API_URL_STORAGE_KEY = 'dbb_connect_custom_api_url'

export interface ApiResponse<T = any> {
  success: boolean
  status?: number
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
    this.baseUrl = this.resolveInitialUrl()
  }

  private resolveInitialUrl(): string {
    const currentHostname = typeof window !== 'undefined' ? window.location.hostname : ''

    // 1. Automatic cleanup of stale Tailscale IP (100.87.162.99) stored from previous sessions
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(CUSTOM_API_URL_STORAGE_KEY)
        if (stored && (stored.includes('100.87.162.99') || (currentHostname && currentHostname.startsWith('192.168.') && !stored.includes(currentHostname)))) {
          window.localStorage.removeItem(CUSTOM_API_URL_STORAGE_KEY)
        }
      } catch {}
    }

    const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
    let savedCustomUrl = typeof window !== 'undefined' ? window.localStorage.getItem(CUSTOM_API_URL_STORAGE_KEY)?.trim() : null

    // Discard any saved custom URL containing the stale Tailscale IP
    if (savedCustomUrl && savedCustomUrl.includes('100.87.162.99')) {
      savedCustomUrl = null
    }

    // Helper to adapt localhost / 127.0.0.1 or stale IPs to the active browser hostname
    const adaptUrl = (url: string): string => {
      if (!url) return ''
      try {
        const parsed = new URL(url)
        if (
          currentHostname &&
          currentHostname !== 'localhost' &&
          currentHostname !== '127.0.0.1'
        ) {
          if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '100.87.162.99') {
            parsed.hostname = currentHostname
            return parsed.toString()
          }
        }
      } catch {}
      return url
    }

    // Priority 1: When browsing from phone/device on WiFi LAN (e.g. http://192.168.1.38:5173),
    // always connect directly to the same host running Laravel: http://192.168.1.38:8000
    if (currentHostname && currentHostname.startsWith('192.168.')) {
      const protocol = window.location.protocol || 'http:'
      return `${protocol}//${currentHostname}:8000`
    }

    // Priority 2: Explicit Vite environment variable (.env / .env.development: VITE_API_URL)
    if (envUrl) {
      return this.normalizeUrl(adaptUrl(envUrl))
    }

    // Priority 3: Explicit valid runtime override in localStorage (from Settings page)
    if (savedCustomUrl) {
      return this.normalizeUrl(adaptUrl(savedCustomUrl))
    }

    // Priority 4: Dynamic hostname fallback if accessed via any other IP
    if (currentHostname && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
      const protocol = window.location.protocol || 'http:'
      return `${protocol}//${currentHostname}:8000`
    }

    // Priority 5: Default LAN IP
    return DEFAULT_API_URL
  }

  private normalizeUrl(url: string): string {
    let clean = (url || '').trim().replace(/\/+$/, '')
    if (!clean) return ''
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`
    }
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
    this.baseUrl = this.resolveInitialUrl()
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

    // Guard against mixed content: browser blocks HTTP calls from HTTPS origins
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && this.baseUrl.startsWith('http://')) {
      this.isServerOnline = false
      return false
    }

    const now = Date.now()
    if (!force && this.isServerOnline !== null && now - this.lastHealthCheck < 15000) {
      return this.isServerOnline
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout for mobile networks

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
      console.warn('[API Client] Backend API baseUrl is not configured.')
      return {
        success: false,
        status: 0,
        isOffline: true,
        error: 'Backend API URL is not configured.',
      }
    }

    const token = this.getToken()
    const cleanEndpoint = endpoint.replace(/^\/+/, '')
    const url = `${this.baseUrl}/api/${cleanEndpoint}`

    // Guard against mixed content: browser blocks insecure HTTP requests from HTTPS contexts
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      return {
        success: false,
        status: 0,
        isOffline: true,
        error: `Insecure HTTP API endpoint (${url}) cannot be accessed from a secure HTTPS environment. Use HTTP for local testing or configure SSL.`,
      }
    }

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

    const method = (options.method || 'GET').toUpperCase()

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
        console.warn(`[API Response Error] ${method} ${url} returned HTTP ${response.status}`, json)
        let errMsg = json.message || `Server returned ${response.status}: ${response.statusText}`
        if (json.errors && typeof json.errors === 'object') {
          const firstErrorList = Object.values(json.errors)[0] as any
          if (Array.isArray(firstErrorList) && firstErrorList.length > 0) {
            errMsg = firstErrorList[0]
          }
        }
        return {
          success: false,
          status: response.status,
          isOffline: false,
          error: errMsg,
          data: json.data,
        }
      }

      return {
        success: true,
        status: response.status,
        isOffline: false,
        data: json.data !== undefined ? json.data : json,
        message: json.message,
        token: json.token,
        user: json.user,
      }
    } catch (err: any) {
      console.warn(`[API Network Status] ${method} ${url} unreachable or offline:`, err?.message || err)
      const isTimeout = err.name === 'AbortError'
      return {
        success: false,
        status: 0,
        isOffline: true,
        error: isTimeout
          ? `API request to ${url} timed out (12s). Verify Laravel server is running.`
          : `Unable to connect to Laravel backend at ${this.baseUrl}. (${err.message || 'Network error'})`,
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
