import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import api from '../api'

const PANEL = { background: 'rgba(13,18,38,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14 }

function Tag({ children, color = '#a78bfa' }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  )
}

function Avatar({ url, size = 32 }) {
  if (url) return <img src={url} className="rounded-full flex-shrink-0" style={{ width: size, height: size }} />
  return (
    <div className="rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: 'rgba(139,92,246,0.2)' }}>
      <svg width={size * 0.5} height={size * 0.5} fill="rgba(196,181,253,0.5)" viewBox="0 0 24 24">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1h20v-1c0-3.345-6.685-5-10-5z" />
      </svg>
    </div>
  )
}

function timeLeft(expires_at) {
  if (!expires_at) return null
  const diff = new Date(expires_at) - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function UserRow({ user, onAction }) {
  const [adjHours, setAdjHours] = useState('')
  const [busy, setBusy]         = useState(false)
  const [msg, setMsg]           = useState(null)
  const tl = timeLeft(user.active_slot?.expires_at)

  async function act(fn) {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ ok: true, text: 'Done' }); onAction() }
    catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* User info row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Avatar url={user.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white truncate">{user.username}</p>
            {user.blacklisted && <Tag color="#f87171">Blacklisted</Tag>}
            {tl && <Tag color="#34d399">{tl} left</Tag>}
            {!tl && user.luarmor_key && <Tag color="rgba(156,163,175,0.5)">No active slot</Tag>}
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.4)' }}>
            ID: {user.discord_id} · Balance: ${Number(user.balance).toFixed(2)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Blacklist / Unblacklist */}
          <button
            disabled={busy}
            onClick={() => act(() => api.post(`/admin/users/${user.id}/${user.blacklisted ? 'unblacklist' : 'blacklist'}`))}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: user.blacklisted ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: user.blacklisted ? '#34d399' : '#f87171',
              border: `1px solid ${user.blacklisted ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              cursor: busy ? 'wait' : 'pointer',
            }}>
            {user.blacklisted ? 'Unblacklist' : 'Blacklist'}
          </button>

          {/* Adjust time — only if has active slot */}
          {user.active_slot && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="hrs"
                value={adjHours}
                onChange={e => setAdjHours(e.target.value)}
                className="w-16 px-2 py-1.5 rounded-lg text-[11px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}
              />
              <button
                disabled={busy || !adjHours}
                onClick={() => act(() => api.post(`/admin/users/${user.id}/adjust-time`, { hours: Number(adjHours) }))}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139,92,246,0.3)',
                  cursor: busy || !adjHours ? 'not-allowed' : 'pointer',
                  opacity: !adjHours ? 0.5 : 1,
                }}>
                Adjust
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <p className="text-[11px] font-semibold" style={{ color: msg.ok ? '#34d399' : '#f87171' }}>
          {msg.ok ? '✓' : '✗'} {msg.text}
        </p>
      )}
    </div>
  )
}

function Section({ title, users, onAction, emptyText }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(196,181,253,0.6)' }}>
        {title} <span style={{ color: 'rgba(156,163,175,0.4)' }}>({users.length})</span>
      </h2>
      {users.length === 0
        ? <p className="text-[12px]" style={{ color: 'rgba(156,163,175,0.3)' }}>{emptyText}</p>
        : users.map(u => <UserRow key={u.id} user={u} onAction={onAction} />)
      }
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useUser()
  const [users, setUsers]   = useState({ with_keys: [], without_keys: [] })
  const [status, setStatus] = useState({ paused: false, paused_at: null })
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([api.get('/admin/users'), api.get('/admin/status')])
      setUsers(u); setStatus(s)
    } catch (e) {
      if (e.message.includes('Forbidden')) {
        alert('Access denied — your Discord ID is not in the admin list.')
        logout()
      }
    }
  }, [logout])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function togglePause() {
    setBusy(true); setMsg(null)
    try {
      await api.post(status.paused ? '/admin/unpause' : '/admin/pause')
      setMsg({ ok: true, text: status.paused ? 'System unpaused' : 'System paused' })
      fetchAll()
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-black text-white">Admin Panel</p>
          <p className="text-[11px]" style={{ color: 'rgba(156,163,175,0.4)' }}>Logged in as {user?.username}</p>
        </div>
        <button onClick={logout}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
          style={{ background: 'rgba(248,113,113,0.08)', color: 'rgba(252,165,165,0.6)', border: '1px solid rgba(248,113,113,0.15)', cursor: 'pointer' }}>
          Log out
        </button>
      </div>

      {/* System control */}
      <div className="p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap" style={PANEL}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(156,163,175,0.45)' }}>System Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: status.paused ? '#f87171' : '#34d399', boxShadow: `0 0 6px ${status.paused ? '#f87171' : '#34d399'}` }} />
            <p className="text-sm font-bold" style={{ color: status.paused ? '#f87171' : '#34d399' }}>
              {status.paused ? 'PAUSED' : 'ACTIVE'}
            </p>
            {status.paused_at && (
              <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.4)' }}>
                since {new Date(status.paused_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            disabled={busy}
            onClick={togglePause}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: status.paused ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
              color: status.paused ? '#34d399' : '#f87171',
              border: `1px solid ${status.paused ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}>
            {busy ? '...' : status.paused ? 'Unpause All' : 'Pause All'}
          </button>
          {msg && <p className="text-[11px] font-semibold" style={{ color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</p>}
        </div>
      </div>

      {/* Users with keys */}
      <div className="p-4 rounded-2xl flex flex-col gap-4" style={PANEL}>
        <Section
          title="Users with Keys"
          users={users.with_keys}
          onAction={fetchAll}
          emptyText="No users with keys yet."
        />
      </div>

      {/* Users without keys */}
      <div className="p-4 rounded-2xl flex flex-col gap-4" style={PANEL}>
        <Section
          title="Users without Keys"
          users={users.without_keys}
          onAction={fetchAll}
          emptyText="No users without keys."
        />
      </div>

    </div>
  )
}
