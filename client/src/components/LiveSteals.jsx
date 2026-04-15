// Tier color map
const TIER_COLORS = {
  og:        '#f472b6',
  best:      '#818cf8',
  legendary: '#a855f7',
  high:      '#34d399',
}

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#a855f7' }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#a855f7' }} />
    </span>
  )
}

// Shown when no steals yet
function WaitingState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
      <div
        className="w-7 h-7 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'rgba(168,85,247,0.6)',
          animation: 'spin 1.2s linear infinite',
        }}
      />
      <p className="text-[10px] text-center leading-relaxed px-2" style={{ color: 'rgba(139,92,246,0.5)' }}>
        Watching for steals…
      </p>
    </div>
  )
}

export default function LiveSteals() {
  // Will be populated from Supabase realtime subscription
  const steals = []

  return (
    <div
      className="w-44 h-full flex flex-col flex-shrink-0"
      style={{
        background: 'rgba(5, 8, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <PulseDot />
        <h3 className="text-xs font-bold tracking-wide text-white">Live Steals</h3>
      </div>

      {/* Content */}
      {steals.length === 0 ? (
        <WaitingState />
      ) : (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {steals.map((steal, i) => {
            const tierColor = TIER_COLORS[steal.tier] || '#7c3aed'
            return (
              <div
                key={i}
                className="steal-hover rounded-xl px-3 py-2 flex-shrink-0 fade-in"
                style={{
                  background: 'rgba(13,18,38,0.70)',
                  border: `1px solid ${tierColor}30`,
                  borderLeft: `3px solid ${tierColor}`,
                }}
              >
                <p className="text-[11px] font-semibold text-white truncate">{steal.item}</p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {steal.user}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
