// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  username: string
  role: 'writer' | 'reader'
  full_name: string
}

// ── NCC Record ────────────────────────────────────────────────────────────────

export type NccStatus = 'open' | 'closed' | 'progress'

export interface NccRecord {
  id: number
  so_number: string
  customer_name: string
  amount: number
  quarter_year: string
  region: string
  location: string
  product_group: string
  service_portfolio: string
  cs_segment: string
  description: string
  root_cause?: string
  corrective_action?: string
  preventive_action?: string
  status: NccStatus
  created_by: number
  created_at: string
  updated_at: string
}

export interface NccCreateRequest {
  so_number: string
  customer_name: string
  amount: number
  quarter_year: string
  region: string
  location: string
  product_group: string
  service_portfolio: string
  cs_segment: string
  description: string
  root_cause?: string
  corrective_action?: string
  preventive_action?: string
  status?: NccStatus
}

export interface NccListResponse {
  records: NccRecord[]
  total: number
  page: number
  page_size: number
}

// ── Filters ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  id: number
  filter_type: string
  value: string
  display_label: string
}

// ── AI ─────────────────────────────────────────────────────────────────────────

export interface AISuggestRequest {
  description: string
  product_group?: string
  region?: string
}

export interface AISuggestResponse {
  root_cause: string
  corrective_action: string
  preventive_action: string
}

export interface AIChatRequest {
  question: string
}

export interface AIChatResponse {
  answer: string
}
