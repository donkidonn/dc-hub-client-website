import { useCallback, useEffect, useState } from 'react'
import api from '../../api'
import { Panel, PanelHeader, PageHeader, Button, Tag, FlashMessage } from '../ui'

const BULLETS = [
  {
    color: '#f87171',
    label: 'Pause',
    body: 'Deactivates every active Luarmor key and records the pause timestamp. Users with active slots immediately stop being able to authenticate.',
  },
  {
    color: '#34d399',
    label: 'Unpause',
    body: 'Restores all keys and extends each slot\'s expiry by the duration the system was paused, so users don\'t lose paid time.',
  },
  {
    color: '#f59e0b',
    label: 'When to use',
    body: 'During deploys, Luarmor outages, brainrot game updates, or any window where the script shouldn\'t run.',
  },
]

export default function System() {
  const [status, setStatus] = useState({ paused: false, paused_at: null })
  const [loading, setLoad]  = useState(true)
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState(null)
  const [error, setError]   = useState(null)

  const fetchStatus = useCallback(async () => {
    try {
      setStatus(await api.get('/admin/status'))
      setError(null)
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function togglePause() {
    setBusy(true); setMsg(null)
    try {
      await api.post(status.paused ? '/admin/unpause' : '/admin/pause')
      setMsg({ ok: true, text: status.paused ? 'System unpaused' : 'System paused' })
      fetchStatus()
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setBusy(false) }
  }

  const dot       = status.paused ? '#f87171' : '#34d399'
  const dotAccent = status.paused ? 'red'     : 'green'

  // Calculate pause duration if paused
  const pauseDuration = (() => {
    if (!status.paused || !status.paused_at) return null
    const ms = Date.now() - new Date(status.paused_at).getTime()
    const m  = Math.floor(ms / 60000)
    const h  = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
  })()

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Maintenance"
        title="System"
        subtitle="Freeze every active slot during downtime windows. Used during deploys, outages, or game updates."
        right={
          <Tag color={dotAccent}>
            <span className="w-1.5 h-1.5 rounded-full mr-0.5"
              style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
            {loading ? 'Loading' : status.paused ? 'Paused' : 'Active'}
          </Tag>
        }
      />

      {/* Main control card */}
      <Panel accent={dotAccent}>
        <PanelHeader
          eyebrow="Controls"
          title="System status"
          subtitle="Pausing freezes every active Luarmor key. Unpausing extends expiry by the paused duration so users don't lose paid time."
        />

        <div className="p-6 flex items-center justify-between gap-6 flex-wrap">
          {/* Left — pulsing status badge */}
          <div className="flex items-center gap-5 min-w-0 flex-1">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `${dot}10`,
                border: `1px solid ${dot}55`,
              }}>
              <span aria-hidden className="absolute inset-0 rounded-full pulse"
                style={{ boxShadow: `0 0 24px ${dot}, inset 0 0 16px ${dot}33` }} />
              <span className="w-3 h-3 rounded-full relative" style={{ background: dot }} />
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-1">Current state</p>
              <p className="text-[24px] font-black tracking-tight leading-none"
                style={{ color: dot, textShadow: `0 0 18px ${dot}66`, letterSpacing: '-0.02em' }}>
                {loading ? '···' : status.paused ? 'Paused' : 'Active'}
              </p>
              {status.paused_at && (
                <p className="text-[11.5px] mt-2 mono" style={{ color: 'rgba(156,163,175,0.6)' }}>
                  Since {new Date(status.paused_at).toLocaleString()}
                  {pauseDuration && (
                    <span className="ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      {pauseDuration} ago
                    </span>
                  )}
                </p>
              )}
              {!status.paused && !loading && (
                <p className="text-[11.5px] mt-2" style={{ color: 'rgba(156,163,175,0.55)' }}>
                  All keys running normally.
                </p>
              )}
              {msg && <div className="mt-2"><FlashMessage msg={msg} /></div>}
            </div>
          </div>

          {/* Right — action button */}
          <Button
            variant={status.paused ? 'success' : 'danger'}
            disabled={busy || loading}
            onClick={togglePause}
            size="lg"
            style={{ padding: '14px 32px', fontSize: 13 }}>
            {busy ? 'Working…' : status.paused ? '▶ Unpause all' : '⏸ Pause all'}
          </Button>
        </div>
      </Panel>

      {/* Info card */}
      <Panel accent="cyan">
        <PanelHeader
          eyebrow="Reference"
          title="How pause / unpause works"
          subtitle="What happens when you flip the switch."
        />
        <div className="p-5 flex flex-col gap-1">
          {BULLETS.map((b, i) => (
            <div key={i} className="flex gap-4 p-3 rounded-[8px] transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `${b.color}12`,
                    border: `1px solid ${b.color}40`,
                  }}>
                  <span className="w-2 h-2 rounded-full"
                    style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold uppercase tracking-wide mb-1"
                  style={{ color: b.color, letterSpacing: '0.06em' }}>
                  {b.label}
                </p>
                <p className="text-[12.5px] leading-relaxed"
                  style={{ color: 'rgba(196,181,253,0.7)' }}>
                  {b.body}
                </p>
              </div>
            </div>
          ))}
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
