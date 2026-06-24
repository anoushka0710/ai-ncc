'use client'

import { useRouter } from 'next/navigation'
import ProtectedLayout from '@/components/ProtectedLayout'
import AddNcc from '@/components/AddNcc'

export default function AddNccPage() {
  const router = useRouter()

  return (
    <ProtectedLayout writerOnly>
      <AddNcc
        apiBase={process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}
        onBack={() => router.push('/dashboard')}
        onSaved={() => router.push('/dashboard')}
      />
    </ProtectedLayout>
  )
}
