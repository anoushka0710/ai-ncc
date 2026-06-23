'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authStore } from '@/lib/auth'
import { User } from '@/types'
import Navbar from './Navbar'

interface Props {
  children: React.ReactNode
  writerOnly?: boolean  // Pass true to block reader-role access
}

export default function ProtectedLayout({ children, writerOnly = false }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      router.replace('/login')
      return
    }
    const u = authStore.getUser()
    if (writerOnly && u?.role !== 'writer') {
      router.replace('/dashboard')
      return
    }
    setUser(u)
    setReady(true)
  }, [router, writerOnly])

  if (!ready) return null  // Avoid flash of content

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <Navbar user={user} />
      <main style={{ padding: '20px' }}>
        {children}
      </main>
    </div>
  )
}
