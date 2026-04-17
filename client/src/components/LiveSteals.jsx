import { useQuery } from '@tanstack/react-query'
import api from '../api'

const TIER_COLORS = {
  og:        '#f472b6',
  best:      '#818cf8',
  legendary: '#a855f7',
  high:      '#34d399',
}

function formatAmount(n) {
  if (!n) return null
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B/s`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M/s`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K/s`
  return `$${n}/s`
}

const TIER_LABELS = {
  og:        'OG',
  best:      '1B+',
  legendary: 'LEGEND',
  high:      'HIGH',
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#a855f7' }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#a855f7' }} />
    </span>
  )
}

function WaitingState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
      <div className="w-7 h-7 rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'rgba(168,85,247,0.6)', animation: 'spin 1.2s linear infinite' }} />
      <p className="text-[10px] text-center leading-relaxed px-2" style={{ color: 'rgba(139,92,246,0.5)' }}>
        Watching for steals…
      </p>
    </div>
  )
}

export default function LiveSteals() {
  const { data: steals = [] } = useQuery({
    queryKey: ['steals', 'recent'],
    queryFn:  () => api.get('/api/steals/recent'),
    refetchInterval: 10_000,
  })

  return (
    <div className="w-44 h-full flex flex-col flex-shrink-0"
      style={{ background: 'rgba(5,8,18,0.88)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <PulseDot />
        <h3 className="text-xs font-bold tracking-wide text-white">Live Steals</h3>
      </div>

      {steals.length === 0 ? (
        <WaitingState />
      ) : (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {steals.map((steal) => {
            const tierColor = TIER_COLORS[steal.tier] || '#7c3aed'
            const tierLabel = TIER_LABELS[steal.tier] || steal.tier?.toUpperCase()
            return (
              <div key={steal.id} className="steal-hover rounded-xl p-2 flex-shrink-0"
                style={{ background: 'rgba(13,18,38,0.70)', border: `1px solid ${tierColor}30`, borderLeft: `3px solid ${tierColor}` }}>

                {/* Image + tier badge row */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {steal.image_url ? (
                    <img
                      src={steal.image_url}
                      alt={steal.item_name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      style={{ border: `1px solid ${tierColor}40` }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}30` }}>
                      <span className="text-[9px]" style={{ color: tierColor }}>?</span>
                    </div>
                  )}
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}40` }}>
                    {tierLabel}
                  </span>
                </div>

                {/* Name */}
                <p className="text-[11px] font-semibold text-white truncate leading-tight">{steal.item_name}</p>

                {/* Rarity */}
                {steal.rarity && (
                  <p className="text-[9px] truncate mt-0.5 font-medium" style={{ color: tierColor + 'cc' }}>
                    {steal.rarity}
                  </p>
                )}

                {/* Value */}
                {steal.amount > 0 && (
                  <p className="text-[9px] font-bold truncate mt-0.5" style={{ color: tierColor }}>
                    {formatAmount(steal.amount)}
                  </p>
                )}

                {/* Mutation */}
                {steal.mutation && (
                  <p className="text-[9px] truncate mt-0.5" style={{ color: 'rgba(196,181,253,0.6)' }}>
                    {steal.mutation}
                  </p>
                )}

                {/* Username + time */}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[9px] truncate" style={{ color: 'rgba(196,181,253,0.45)' }}>
                    {steal.users?.username ?? 'Unknown'}
                  </p>
                  <p className="text-[8px] flex-shrink-0 ml-1" style={{ color: 'rgba(156,163,175,0.3)' }}>
                    {timeAgo(steal.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
