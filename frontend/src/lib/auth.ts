import { User } from '@/types'

const TOKEN_KEY = 'ncc_token'
const USER_KEY  = 'ncc_user'

export const authStore = {
  setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },

  isLoggedIn(): boolean {
    return !!this.getToken()
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // also clear cookie set during login
    document.cookie = 'access_token=; path=/; max-age=0'
  },
}
