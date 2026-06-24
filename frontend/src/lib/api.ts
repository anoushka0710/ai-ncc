import {
  LoginResponse, User,
  NccRecord, NccCreateRequest, NccListResponse,
  FilterOption,
  AISuggestRequest, AISuggestResponse,
  AIChatRequest, AIChatResponse,
} from '@/types'
import { authStore } from './auth'
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  isForm = false,
): Promise<T> {
  const token = authStore.getToken()

  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw { status: res.status, message: err.detail ?? 'Request failed' }
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  // Login uses form-encoded body (OAuth2PasswordRequestForm)
  async login(username: string, password: string): Promise<LoginResponse> {
    const body = new URLSearchParams({ username, password })
    return request<LoginResponse>('/auth/login', { method: 'POST', body }, true)
  },

  async me(): Promise<User> {
    return request<User>('/auth/me')
  },
}

// ── NCC Records ───────────────────────────────────────────────────────────────

export const nccApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<NccListResponse> {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v))
    })
    return request<NccListResponse>(`/ncc?${qs}`)
  },

  async get(id: number): Promise<NccRecord> {
    return request<NccRecord>(`/ncc/${id}`)
  },

  async create(data: NccCreateRequest): Promise<NccRecord> {
    return request<NccRecord>('/ncc', { method: 'POST', body: JSON.stringify(data) })
  },

  async update(id: number, data: Partial<NccCreateRequest>): Promise<NccRecord> {
    return request<NccRecord>(`/ncc/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  async remove(id: number): Promise<void> {
    return request<void>(`/ncc/${id}`, { method: 'DELETE' })
  },

  exportCsvUrl(params: Record<string, string> = {}): string {
    const qs = new URLSearchParams(params)
    const token = authStore.getToken()
    if (token) qs.set('token', token)
    return `${BASE_URL}/ncc/export/csv?${qs}`
  },
}

// ── Filters ───────────────────────────────────────────────────────────────────

export const filtersApi = {
  async getAll(): Promise<FilterOption[]> {
    return request<FilterOption[]>('/filters')
  },

  async getByType(filter_type: string): Promise<FilterOption[]> {
    return request<FilterOption[]>(`/filters?filter_type=${filter_type}`)
  },
}

// ── AI ────────────────────────────────────────────────────────────────────────

export const aiApi = {
  async suggest(data: AISuggestRequest): Promise<AISuggestResponse> {
    return request<AISuggestResponse>('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async chat(data: AIChatRequest): Promise<AIChatResponse> {
    return request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
