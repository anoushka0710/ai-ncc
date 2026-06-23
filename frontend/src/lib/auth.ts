import Cookies from 'js-cookie'
import { User } from '@/types'

const TOKEN_KEY = 'access_token'
const USER_KEY  = 'ncc_user'

export const authStore = {
  // Save token + user after login
  setSession: (token: string, user: User) => {
    Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: 'strict' }) // 1 day
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  // Clear everything on logout
  clearSession: () => {
    Cookies.remove(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getToken: (): string | undefined => Cookies.get(TOKEN_KEY),

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as User }
    catch { return null }
  },

  isLoggedIn: (): boolean => !!Cookies.get(TOKEN_KEY),
}
