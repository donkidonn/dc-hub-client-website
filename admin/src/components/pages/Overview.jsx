import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { Panel, PanelHeader, PageHeader, Button, Stat, FlashMessage } from '../ui'

const STATS = [
  {
    id: 'total_users', label: 'Total users', sub: 'Registered accounts', accent: 'cyan',
    format: v => Number(v).toLocaleString(),
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  },
  {
    id: 'active_slots', label: 'Active slots', sub: 'Currently running', accent: 'violet',
    format: v => Number(v).toLocaleString(),
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>,
  },
  {
    id: 'total_balance', label: 'Total balance', sub: 'Across all accounts', accent: 'green',
    format: v => `$${Number(v).toFixed(2)}`,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    id: 'active_coupons', label: 'Active coupons', sub: 'Valid promo codes', accent: 'magenta',
    format: v => Number(v).toLocaleString(),
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 12a2 2 0 012-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2z"/><line x1="9" y1="8" x2="9" y2="10"/><line x1="9" y1="14" x2="9" y2="16"/></svg>,
  },
]

const ACTIONS = [
  {
    title: 'Manage users', body: 'Blacklist, adjust slot time, credit balance.',
    path: '/users', accent: '#22d3ee',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  },
  {
    title: 'Issue coupon', body: 'Create promo codes with amount & limits.',
    path: '/coupons', accent: '#a855f7',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 12a2 2 0 012-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2z"/></svg>,
  },
  {
    title: 'System control', body: 'Pause / unpause for maintenance.',
    path: '/system', accent: '#f472b6',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  },
]

function ActionCard({ tip, navigate }) {
  return (
    <button onClick={() => navigate(tip.path)}
      className="group text-left p-4 rounded-[10px] flex items-start gap-3 transition-all duration-200 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = `${tip.accent}0d`
        e.currentTarget.style.borderColor = `${tip.accent}55`
        e.currentTarget.style.transform   = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.015)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform   = 'translateY(0)'
      }}>
      <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${tip.accent}15`, border: `1px solid ${tip.accent}33`, color: tip.accent }}>
        {tip.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-bold text-white tracking-tight">{tip.title}</p>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgba(156,163,175,0.55)' }}>{tip.body}</p>
      </div>
      <span className="text-[14px] transition-transform group-hover:translate-x-0.5"
        style={{ color: tip.accent }}>→</span>
    </button>
  )
}

function SystemStatusPanel() {
  const [status, setStatus] = useState({ paused: false, paused_at: null })
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState(null)

  async function refresh() {
    try { setStatus(await api.get('/admin/status')) } catch {}
  }
  useEffect(() => { refresh() }, [])

  async function toggle() {
    setBusy(true); setMsg(null)
    try {
      await api.post(status.paused ? '/admin/unpause' : '/admin/pause')
      setMsg({ ok: true, text: status.paused ? 'System unpaused' : 'System paused' })
      refresh()
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setBusy(false) }
  }

  const dot = status.paused ? '#f87171' : '#34d399'

  return (
    <Panel accent={status.paused ? 'red' : 'green'}>
      <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${dot}14`, border: `1px solid ${dot}55` }}>
            <span className="absolute inset-0 rounded-full pulse"
              style={{ boxShadow: `0 0 16px ${dot}`, opacity: 0.6 }} />
            <span className="w-2 h-2 rounded-full relative" style={{ background: dot }} />
          </div>
          <div className="min-w-0">
            <p className="eyebrow mb-1">System status</p>
            <p className="text-[14px] font-bold text-white tracking-tight">
              {status.paused ? 'Paused' : 'Active'}
              <span className="ml-2 text-[11px] font-normal" style={{ color: 'rgba(156,163,175,0.55)' }}>
                {status.paused
                  ? `· frozen ${status.paused_at ? 'since ' + new Date(status.paused_at).toLocaleTimeString() : ''}`
                  : '· all keys running normally'}
              </span>
            </p>
            {msg && <div className="mt-1.5"><FlashMessage msg={msg} /></div>}
          </div>
        </div>

        <Button
          variant={status.paused ? 'success' : 'danger'}
          disabled={busy}
          onClick={toggle}
          size="lg">
          {busy ? '…' : status.paused ? 'Unpause all' : 'Pause all'}
        </Button>
      </div>
    </Panel>
  )
}

export default function Overview() {
  const navigate              = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    api.get('/admin/overview')
      .then(d => { if (!cancelled) setStats(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        subtitle="Live snapshot of users, slots, balance, and system health."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <Stat
            key={s.id}
            label={s.label}
            value={stats ? s.format(stats[s.id] ?? 0) : '0'}
            sub={s.sub}
            accent={s.accent}
            icon={s.icon}
            loading={loading}
          />
        ))}
      </div>

      {/* System status row */}
      <SystemStatusPanel />

      {/* Quick actions */}
      <Panel accent="violet">
        <PanelHeader
          eyebrow="Shortcuts"
          title="Quick actions"
          subtitle="Jump straight into the most common admin tasks."
        />
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {ACTIONS.map((tip, i) => <ActionCard key={i} tip={tip} navigate={navigate} />)}
        </div>
      </Panel>

      {error && (
        <p className="text-[12px] inline-flex items-center gap-1.5 uppercase tracking-wide font-bold"
          style={{ color: '#f87171' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
          {error}
        </p>
      )}
    </div>
  )
}
