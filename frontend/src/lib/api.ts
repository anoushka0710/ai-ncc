import axios from 'axios'
import Cookies from 'js-cookie'

// ── Axios instance ────────────────────────────────────────────────────────────
// All calls go to /api/... which Next.js rewrites to http://localhost:8000/...

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('user')
      // Use window.location to avoid Next.js router import issues in lib
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (username: string, password: string) => {
    // FastAPI expects form data for OAuth2 token endpoint
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const res = await axios.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return res.data as { access_token: string; token_type: string }
  },

  me: async () => {
    const res = await api.get('/auth/me')
    return res.data
  },
}

// ── NCC Records ───────────────────────────────────────────────────────────────

export const nccApi = {
  list: async (params?: {
    region?: string
    product_group?: string
    location?: string
    service_portfolio?: string
    cs_segment?: string
    quarter_year?: string
    status?: string
    page?: number
    page_size?: number
  }) => {
    const res = await api.get('/ncc', { params })
    return res.data
  },

  get: async (id: number) => {
    const res = await api.get(`/ncc/${id}`)
    return res.data
  },

  create: async (data: unknown) => {
    const res = await api.post('/ncc', data)
    return res.data
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/ncc/${id}`, data)
    return res.data
  },

  delete: async (id: number) => {
    const res = await api.delete(`/ncc/${id}`)
    return res.data
  },

  exportCsv: () => {
    const token = Cookies.get('access_token')
    window.open(`/api/ncc/export/csv?token=${token}`, '_blank')
  },
}

// ── Filters ───────────────────────────────────────────────────────────────────

export const filtersApi = {
  getAll: async (filter_type?: string) => {
    const res = await api.get('/filters', { params: { filter_type } })
    return res.data
  },
}

// ── AI ────────────────────────────────────────────────────────────────────────

export const aiApi = {
  suggest: async (data: { description: string; product_group?: string; region?: string }) => {
    const res = await api.post('/ai/suggest', data)
    return res.data
  },

  chat: async (question: string) => {
    const res = await api.post('/ai/chat', { question })
    return res.data
  },
}
