'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, IndianRupee, MapPin, Package,
  RotateCcw, Download, Pencil, ChevronLeft, ChevronRight
} from 'lucide-react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { nccApi, filtersApi } from '@/lib/api'
import { NccRecord, NccListResponse, FilterOption } from '@/types'
import styles from './dashboard.module.css'

function formatAmount(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'badge-open', closed: 'badge-closed', progress: 'badge-progress',
  }
  return <span className={`badge ${map[status] ?? 'badge-open'}`}>{status}</span>
}

const LIMIT = 20

export default function DashboardPage() {
  const router = useRouter()

  const [filters, setFilters] = useState({
    quarter_year: '', region: '', location: '',
    product_group: '', status: '',
  })
  const [page, setPage]           = useState(1)
  const [data, setData]           = useState<NccListResponse | null>(null)
  const [filterOpts, setFilterOpts] = useState<FilterOption[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // All-time stats — fetched once, never filtered
  const [allTime, setAllTime] = useState({
    total: 0, amount: 0, topRegion: '—', topProduct: '—'
  })

  const records: NccRecord[] = data?.records ?? []
  const totalRecords = data?.total ?? 0

  const optsByType = filterOpts.reduce<Record<string, FilterOption[]>>((acc, f) => {
    ;(acc[f.filter_type] ??= []).push(f); return acc
  }, {})

 
 // ── Fetch all-time stats once on mount ──────────────────────────────────────
useEffect(() => {
  const timer = setTimeout(() => {
    // Backend list endpoint caps limit at 100, so using 1000 triggers validation failure.
    nccApi.list({ limit: 100 }).then(res => {
      const all = res.records
      const amount = all.reduce((s, r) => s + r.amount, 0)
      const topRegion = all.length
        ? Object.entries(all.reduce<Record<string, number>>((acc, r) => {
            acc[r.region] = (acc[r.region] ?? 0) + 1; return acc
          }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
        : '—'
      const topProduct = all.length
        ? Object.entries(all.reduce<Record<string, number>>((acc, r) => {
            acc[r.product_group] = (acc[r.product_group] ?? 0) + 1; return acc
          }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
        : '—'
      setAllTime({ total: res.total, amount, topRegion, topProduct })
    }).catch(() => {})
  }, 100)
  return () => clearTimeout(timer)
}, [])


  // ── Fetch filtered records ──────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await nccApi.list({ ...filters, page, limit: LIMIT })
      setData(res)
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { filtersApi.getAll().then(setFilterOpts).catch(() => {}) }, [])
  useEffect(() => { fetchRecords() }, [fetchRecords])

  function handleFilterChange(key: string, value: string) {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  function handleReset() {
    setFilters({ quarter_year: '', region: '', location: '', product_group: '', status: '' })
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / LIMIT))
  const startRow   = (page - 1) * LIMIT + 1
  const endRow     = Math.min(page * LIMIT, totalRecords)
  const hasFilters = Object.values(filters).some(Boolean)

  const STAT_CARDS = [
    {
      accent: '#3B82F6',
      icon: <FileText size={16} strokeWidth={1.5} />,
      label: 'Total records',
      value: allTime.total || '—',
      sub: 'All time · full database',
    },
    {
      accent: '#10B981',
      icon: <IndianRupee size={16} strokeWidth={1.5} />,
      label: 'Total amount',
      value: allTime.amount ? formatAmount(allTime.amount) : '—',
      sub: 'Non-conformance value',
    },
    {
      accent: '#F59E0B',
      icon: <MapPin size={16} strokeWidth={1.5} />,
      label: 'Top region',
      value: allTime.topRegion,
      sub: 'Most cases overall',
    },
    {
      accent: '#8B5CF6',
      icon: <Package size={16} strokeWidth={1.5} />,
      label: 'Top product group',
      value: allTime.topProduct,
      sub: 'Most cases overall',
      small: true,
    },
  ]

  return (
    <ProtectedLayout>
      <div className={styles.page}>

        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageHint}>Non-conformance case tracker</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasFilters && (
              <button className="btn btn-sm" onClick={handleReset}>
                <RotateCcw size={12} strokeWidth={2} /> Reset filters
              </button>
            )}
            <a
              href={nccApi.exportCsvUrl(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
              )}
              className="btn"
              download
            >
              <Download size={13} strokeWidth={2} /> Export CSV
            </a>
          </div>
        </div>

        {/* Stat cards */}
        <div className={styles.statGrid}>
          {STAT_CARDS.map(({ accent, icon, label, value, sub, small }) => (
            <div key={label} className={styles.statCard} style={{ borderLeft: `3px solid ${accent}` }}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{label}</span>
                <span className={styles.statIcon} style={{ color: accent }}>{icon}</span>
              </div>
              <div className={styles.statValue} style={{ fontSize: small ? 17 : undefined }}>
                {value}
              </div>
              <div className={styles.statSub}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Table with inline filters */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>NCC Records</span>
            {!loading && (
              <span className={styles.recordCount}>
                {totalRecords === 0
                  ? 'No records'
                  : `Showing ${startRow}–${endRow} of ${totalRecords}${hasFilters ? ' (filtered)' : ''}`}
              </span>
            )}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.labelRow}>
                  <th>SO Number</th>
                  <th>Customer</th>
                  <th>Region</th>
                  <th>Product Group</th>
                  <th>Amount</th>
                  <th>Quarter</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
                <tr className={styles.filterRow}>
                  <th><span className={styles.noFilter} /></th>
                  <th><span className={styles.noFilter} /></th>
                  <th>
                    <select
                      value={filters.region}
                      onChange={e => handleFilterChange('region', e.target.value)}
                      className={filters.region ? styles.filterSelectActive : styles.filterSelect}
                    >
                      <option value="">All</option>
                      {(optsByType['region'] ?? []).map(o => (
                        <option key={o.value} value={o.value}>{o.display_label}</option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filters.product_group}
                      onChange={e => handleFilterChange('product_group', e.target.value)}
                      className={filters.product_group ? styles.filterSelectActive : styles.filterSelect}
                    >
                      <option value="">All</option>
                      {(optsByType['product_group'] ?? []).map(o => (
                        <option key={o.value} value={o.value}>{o.display_label}</option>
                      ))}
                    </select>
                  </th>
                  <th><span className={styles.noFilter} /></th>
                  <th>
                    <select
                      value={filters.quarter_year}
                      onChange={e => handleFilterChange('quarter_year', e.target.value)}
                      className={filters.quarter_year ? styles.filterSelectActive : styles.filterSelect}
                    >
                      <option value="">All</option>
                      {(optsByType['quarter_year'] ?? []).map(o => (
                        <option key={o.value} value={o.value}>{o.display_label}</option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filters.location}
                      onChange={e => handleFilterChange('location', e.target.value)}
                      className={filters.location ? styles.filterSelectActive : styles.filterSelect}
                    >
                      <option value="">All</option>
                      {(optsByType['location'] ?? []).map(o => (
                        <option key={o.value} value={o.value}>{o.display_label}</option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filters.status}
                      onChange={e => handleFilterChange('status', e.target.value)}
                      className={filters.status ? styles.filterSelectActive : styles.filterSelect}
                    >
                      <option value="">All</option>
                      {(optsByType['status'] ?? []).map(o => (
                        <option key={o.value} value={o.value}>{o.display_label}</option>
                      ))}
                    </select>
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className={styles.loadingCell}>Loading records…</td></tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyCell}>
                      No records found.{hasFilters && ' Try clearing filters.'}
                    </td>
                  </tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td className={styles.mono}>{r.so_number}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.region}</td>
                    <td>{r.product_group}</td>
                    <td>₹{r.amount.toLocaleString('en-IN')}</td>
                    <td>{r.quarter_year}</td>
                    <td>{r.location}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => router.push(`/ncc/${r.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil size={12} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className="btn btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={13} strokeWidth={2} /> Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="btn btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
