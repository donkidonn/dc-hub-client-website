import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../api'
import {
  Panel, PanelHeader, PageHeader,
  Tag, Button, Input, Avatar,
  EmptyState, FlashMessage, formatTimeLeft,
} from '../ui'

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'with_keys',   label: 'With keys' },
  { id: 'no_keys',     label: 'No keys' },
  { id: 'blacklisted', label: 'Blacklisted' },
]

function UserRow({ user, onAction }) {
  const [adjHours, setAdjHours]   = useState('')
  const [adjAmount, setAdjAmount] = useState('')
  const [busy, setBusy]           = useState(false)
  const [msg, setMsg]             = useState(null)

  const slotMs = user.active_slot
    ? new Date(user.active_slot.expires_at) - Date.now()
    : null
  const slotActive = slotMs && slotMs > 0

  async function act(fn) {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ ok: true, text: 'Done' }); onAction() }
    catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setBusy(false) }
  }

  return (
    <div className="p-4 rounded-[10px] flex flex-col gap-3 transition-colors duration-150 relative"
      style={{
        background: user.blacklisted ? 'rgba(248,113,113,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${user.blacklisted ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}>

      {/* Top row: identity + status + primary action */}
      <div className="flex items-start gap-3 flex-wrap">
        <Avatar url={user.avatar_url} size={42} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="text-[13.5px] font-bold text-white truncate max-w-[260px]">{user.username}</p>
            {user.blacklisted && <Tag color="red">Blacklisted</Tag>}
            {slotActive          && <Tag color="green">{formatTimeLeft(slotMs)} left</Tag>}
            {!slotActive && user.luarmor_key && <Tag color="cyan">Idle</Tag>}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[10.5px] mono"
            style={{ color: 'rgba(156,163,175,0.55)' }}>
            <span>ID {user.discord_id}</span>
            <span style={{ color: '#34d399' }}>${Number(user.balance).toFixed(2)}</span>
            {user.luarmor_key && (
              <span className="truncate max-w-[160px]">KEY {user.luarmor_key.slice(0, 10)}…</span>
            )}
          </div>
        </div>

        <Button
          variant={user.blacklisted ? 'success' : 'danger'}
          disabled={busy}
          onClick={() => act(() => api.post(`/admin/users/${user.id}/${user.blacklisted ? 'unblacklist' : 'blacklist'}`))}>
          {user.blacklisted ? 'Unblacklist' : 'Blacklist'}
        </Button>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 flex-wrap pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

        {user.active_slot && (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={adjHours}
              onChange={e => setAdjHours(e.target.value)}
              placeholder="±h"
              style={{ padding: '7px 10px', fontSize: 11.5, width: 70 }}
            />
            <Button
              size="sm"
              disabled={busy || !adjHours || Number(adjHours) === 0}
              onClick={() => act(async () => {
                await api.post(`/admin/users/${user.id}/adjust-time`, { hours: Number(adjHours) })
                setAdjHours('')
              })}>
              Adjust time
            </Button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={adjAmount}
            onChange={e => setAdjAmount(e.target.value)}
            placeholder="±$"
            style={{ padding: '7px 10px', fontSize: 11.5, width: 70 }}
          />
          <Button
            size="sm"
            variant="cyan"
            disabled={busy || !adjAmount || Number(adjAmount) === 0}
            onClick={() => act(async () => {
              await api.post(`/admin/users/${user.id}/adjust-balance`, { amount: Number(adjAmount) })
              setAdjAmount('')
            })}>
            Adjust balance
          </Button>
        </div>

        <div className="flex-1" />
        <FlashMessage msg={msg} />
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers]   = useState({ with_keys: [], without_keys: [] })
  const [tab, setTab]       = useState('all')
  const [query, setQuery]   = useState('')
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const d = await api.get('/admin/users')
      setUsers(d)
      setError(null)
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() => {
    const all = [...users.with_keys, ...users.without_keys]
    let list
    if      (tab === 'with_keys')   list = users.with_keys
    else if (tab === 'no_keys')     list = users.without_keys
    else if (tab === 'blacklisted') list = all.filter(u => u.blacklisted)
    else                            list = all

    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.discord_id || '').includes(q)
    )
  }, [users, tab, query])

  const counts = {
    all:         users.with_keys.length + users.without_keys.length,
    with_keys:   users.with_keys.length,
    no_keys:     users.without_keys.length,
    blacklisted: [...users.with_keys, ...users.without_keys].filter(u => u.blacklisted).length,
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Access control"
        title="Users"
        subtitle="Blacklist, adjust slot time, and manage account balances."
        right={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.22)' }}>
            <span className="eyebrow" style={{ color: 'rgba(34,211,238,0.65)' }}>Total</span>
            <span className="text-[13px] font-black tabular-nums" style={{ color: '#22d3ee' }}>
              {counts.all.toLocaleString()}
            </span>
          </div>
        }
      />

      <Panel accent="cyan">
        {/* Toolbar */}
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-3.5 py-2 rounded-[8px] text-[11.5px] font-bold transition-all flex items-center gap-2.5 uppercase tracking-wide"
                  style={{
                    background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
                    color: active ? '#22d3ee' : 'rgba(196,181,253,0.55)',
                    border: `1px solid ${active ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}>
                  {t.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md tabular-nums font-black mono"
                    style={{
                      background: active ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#22d3ee' : 'rgba(156,163,175,0.55)',
                    }}>
                    {counts[t.id]}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="w-full md:w-80">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search username or Discord ID…"
            />
          </div>
        </div>

        {/* Result count strip */}
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="eyebrow">{TABS.find(t => t.id === tab)?.label} ·</p>
          <p className="text-[11.5px] font-bold tabular-nums mono" style={{ color: '#22d3ee' }}>
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
          </p>
          {query && (
            <p className="text-[11px]" style={{ color: 'rgba(156,163,175,0.45)' }}>
              · filtered by "<span className="mono">{query}</span>"
            </p>
          )}
        </div>

        {/* Rows */}
        <div className="p-4 flex flex-col gap-2.5">
          {loading
            ? <EmptyState message="Loading users…" />
            : filtered.length === 0
              ? <EmptyState
                  message="No users found"
                  hint={query ? 'Try clearing the search' : 'Users will appear here once they join.'}
                  icon={
                    <svg width="22" height="22" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth="1.6" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                  } />
              : filtered.map(u => <UserRow key={u.id} user={u} onAction={fetchAll} />)
          }
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
