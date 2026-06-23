'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStore } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    if (authStore.isLoggedIn()) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}
