'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardCheck, LayoutDashboard, Plus, Bot, LogOut } from 'lucide-react'
import { authStore } from '@/lib/auth'
import { User } from '@/types'
import styles from './Navbar.module.css'

interface NavbarProps {
  user: User | null
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ncc/new',   label: 'Add NCC',   icon: Plus, writerOnly: true },
  { href: '/chat',      label: 'AI Chat',   icon: Bot },
]

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  function handleLogout() {
    authStore.clearSession()
    router.push('/login')
  }

  return (
    <nav className={styles.navbar}>
      {/* Brand */}
      <div className={styles.brand}>
        <ClipboardCheck size={18} strokeWidth={1.5} style={{ color: '#185FA5' }} />
        <span>NCC CAMS</span>
      </div>

      {/* Nav links */}
      <div className={styles.links}>
        {NAV_LINKS.map(({ href, label, icon: Icon, writerOnly }) => {
          if (writerOnly && user?.role !== 'writer') return null
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={[styles.link, active ? styles.linkActive : ''].join(' ')}>
              <Icon size={14} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div className={styles.right}>
        {user && (
          <>
            <span className={`badge ${user.role === 'writer' ? 'badge-writer' : 'badge-reader'}`}>
              {user.role === 'writer' ? 'Writer' : 'Reader'}
            </span>
            <div className={styles.userChip}>
              <div className={styles.avatar} data-role={user.role}>
                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className={styles.userName}>{user.full_name}</span>
            </div>
          </>
        )}
        <button
          className="btn btn-sm"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={13} strokeWidth={2} />
        </button>
      </div>
    </nav>
  )
}
