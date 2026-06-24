'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, Eye, EyeOff, Pencil, AlertCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import { authStore } from '@/lib/auth'
import styles from './login.module.css'

type Role = 'writer' | 'reader'

// ✅ Fixed: matches backend seed_users.py credentials
const ROLE_CREDENTIALS: Record<Role, { username: string; password: string; label: string }> = {
  writer: { username: 'admin',  password: 'admin123',  label: 'Writer' },
  reader: { username: 'viewer', password: 'view123',   label: 'Reader' },
}

export default function LoginPage() {
  const router = useRouter()

  const [role,     setRole]     = useState<Role>('writer')
  const [username, setUsername] = useState(ROLE_CREDENTIALS.writer.username)
  const [password, setPassword] = useState(ROLE_CREDENTIALS.writer.password)
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (authStore.isLoggedIn()) router.replace('/dashboard')
  }, [router])

  function handleRoleChange(r: Role) {
    setRole(r)
    setUsername(ROLE_CREDENTIALS[r].username)
    setPassword(ROLE_CREDENTIALS[r].password)
    setError('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password.')
      return
    }
    setLoading(true)
    setError('')

    try {
      // 1. Get JWT token (form-encoded for OAuth2PasswordRequestForm)
      const { access_token } = await authApi.login(username.trim(), password.trim())

      // 2. Store token temporarily so /auth/me can use it
      localStorage.setItem('ncc_token', access_token)

      // 3. Fetch user profile
      const user = await authApi.me()

      // 4. Persist full session
      authStore.setSession(access_token, user)

      // 5. Navigate to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      setError(e?.message ?? 'Incorrect username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <ClipboardCheck size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className={styles.logoTitle}>NCC CAMS</div>
            <div className={styles.logoSub}>Non-Conformance Case Management</div>
          </div>
        </div>

        <form onSubmit={handleLogin} noValidate>

          {/* Role pills */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Login as</p>
            <div className={styles.rolePills}>
              {(['writer', 'reader'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={[styles.rolePill, role === r ? styles[`pill_${r}`] : ''].join(' ')}
                  onClick={() => handleRoleChange(r)}
                >
                  {r === 'writer'
                    ? <Pencil size={12} strokeWidth={2} />
                    : <Eye size={12} strokeWidth={2} />}
                  {ROLE_CREDENTIALS[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className={styles.field}>
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="Enter username"
              className={error ? 'error' : ''}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className="field-label" htmlFor="password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                className={error ? 'error' : ''}
                disabled={loading}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox} role="alert">
              <AlertCircle size={14} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`btn btn-primary btn-full ${styles.loginBtn}`}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Signing in...</>
              : 'Sign in →'}
          </button>
        </form>

        {/* Hint */}
        <div className={styles.hint}>
          <span>Writer: <code>admin / admin123</code></span>
          <span className={styles.hintDot}>·</span>
          <span>Reader: <code>viewer / view123</code></span>
        </div>
      </div>
    </div>
  )
}
