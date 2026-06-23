'use client'
import ProtectedLayout from '@/components/ProtectedLayout'

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--radius-md)',
        padding: '40px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '14px'
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          Dashboard — Day 6
        </div>
        <div>Filter bar, stat cards, and NCC table will be built here.</div>
      </div>
    </ProtectedLayout>
  )
}
