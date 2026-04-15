import { useContext } from 'react'
import backgroundImg from '../assets/background.png'
import ParticleCanvas from './ParticleCanvas'
import { AnimationContext } from '../context/AnimationContext'

// Discord SVG logo
function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

// Feature list item
function Feature({ icon, label, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(156,163,175,0.55)' }}>{sub}</p>
      </div>
    </div>
  )
}

// Animated floating orb
function Orb({ style }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{ filter: 'blur(80px)', ...style }} />
  )
}

export default function LoginPage({ onLogin }) {
  const { animationsEnabled, toggleAnimations } = useContext(AnimationContext)
  const FEATURES = [
    {
      icon: (
        <svg width="15" height="15" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      label: 'Auto Joiner & Steal Tracker',
      sub: 'Automatically joins & logs the best brainrots in real time',
    },
    {
      icon: (
        <svg width="15" height="15" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <path d="M8 21h8M12 21v-8"/>
          <path d="M7.5 4H4C4 8 6.5 11 10 12M16.5 4H20C20 8 17.5 11 14 12"/>
          <path d="M7.5 4A4.5 4.5 0 0016.5 4V2h-9v2z"/>
        </svg>
      ),
      label: 'Global Leaderboards',
      sub: 'Compete for the top spot across all Grands',
    },
    {
      icon: (
        <svg width="15" height="15" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      ),
      label: 'Grand Slot Management',
      sub: 'Purchase & manage your farming slots all in one place',
    },
    {
      icon: (
        <svg width="15" height="15" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      ),
      label: 'Detailed Statistics',
      sub: 'Track your steal history, deposits & per-tier performance',
    },
  ]


  return (
    <div
      data-animations={animationsEnabled ? 'true' : 'false'}
      className="relative flex h-screen w-screen overflow-hidden text-white"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(3,6,16,0.72)', zIndex: 0 }} />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Floating ambient orbs — only when animations on */}
      {animationsEnabled && (
        <>
          <Orb style={{ width: 500, height: 500, top: '-10%', left: '-8%', background: 'rgba(124,58,237,0.18)', animation: 'floatSlow 9s ease-in-out infinite' }} />
          <Orb style={{ width: 400, height: 400, bottom: '-5%', right: '-5%', background: 'rgba(34,211,238,0.12)', animation: 'float 7s ease-in-out infinite' }} />
          <Orb style={{ width: 300, height: 300, top: '40%', left: '35%', background: 'rgba(244,114,182,0.08)', animation: 'floatSlow 11s ease-in-out infinite 2s' }} />
        </>
      )}

      {/* Effects toggle — top-right corner */}
      <button
        onClick={toggleAnimations}
        title={animationsEnabled ? 'Turn off animations' : 'Turn on animations'}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200"
        style={{
          background: animationsEnabled ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${animationsEnabled ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: animationsEnabled ? 'rgba(196,181,253,0.8)' : 'rgba(156,163,175,0.4)',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={animationsEnabled ? '#a78bfa' : 'rgba(156,163,175,0.4)'}
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Effects {animationsEnabled ? 'ON' : 'OFF'}
      </button>

      {/* Content */}
      <div className="relative flex w-full h-full" style={{ zIndex: 1 }}>

        {/* ── Left side — branding + features ── */}
        <div className="hidden md:flex flex-col justify-center flex-1 px-12 lg:px-20 gap-10">

          {/* Logo */}
          <div>
            <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 42, color: '#fff', lineHeight: 1.05, letterSpacing: '0.01em' }}>
              GRAND
            </p>
            <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 42, lineHeight: 1.05, letterSpacing: '0.01em', background: 'linear-gradient(100deg, #7c3aed 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
              NOTIFIER
            </p>

            {/* Brushstroke underline */}
            <div className="flex items-center gap-1 mt-1" style={{ maxWidth: 280 }}>
              <svg viewBox="0 0 148 10" preserveAspectRatio="none" style={{ flex: 1, height: 8 }}>
                <defs>
                  <linearGradient id="lgBrush" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.5"/>
                  </linearGradient>
                </defs>
                <path d="M2,6.5 C15,3.5 35,8 60,5.5 C85,3 110,7.5 146,4.5" stroke="url(#lgBrush)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" style={{ opacity: 0.85 }}>
                <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>
              </svg>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(196,181,253,0.55)' }}>
              The cheapest Auto Joiner for Steal a Brainrot — logs the best brainrots so you never miss a steal.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {FEATURES.map((f) => <Feature key={f.label} {...f} />)}
          </div>

          {/* Launch badge */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee', animation: 'pulseGlow 2s ease-in-out infinite' }} />
              Now Live — Be an Early Member
            </div>
          </div>
        </div>

        {/* ── Right side — login card ── */}
        <div className="flex items-center justify-center w-full md:w-[420px] lg:w-[460px] flex-shrink-0 p-6">
          <div className="w-full max-w-sm">

            {/* Card */}
            <div
              className="relative rounded-3xl p-8 overflow-hidden"
              style={{
                background: 'rgba(8,12,28,0.85)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)',
              }}
            >
              {/* Gradient border top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #22d3ee, #f472b6)' }} />

              {/* Inner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)', animation: 'pulseGlow 3s ease-in-out infinite' }} />

              {/* Mobile logo */}
              <div className="md:hidden mb-6 text-center">
                <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: '#fff', lineHeight: 1 }}>GRAND</p>
                <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, lineHeight: 1, background: 'linear-gradient(100deg,#7c3aed,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>NOTIFIER</p>
              </div>

              {/* Headline */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white leading-tight">Get started.</h2>
                <p className="text-[13px] mt-1.5" style={{ color: 'rgba(156,163,175,0.5)' }}>
                  Sign in with Discord to access your dashboard.
                </p>
              </div>

              {/* Discord login button */}
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 group"
                style={{
                  background: 'linear-gradient(135deg, #5865F2, #4752c4)',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(88,101,242,0.4)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(88,101,242,0.6)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(88,101,242,0.4)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <DiscordIcon />
                Continue with Discord
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(156,163,175,0.3)' }}>
                  Access
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Page links preview */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Home',         color: '#22d3ee', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
                  { label: 'Statistics',   color: '#f0b429', icon: null, bars: true },
                  { label: 'Slots',        color: '#a855f7', icon: null, grid: true },
                  { label: 'Leaderboards', color: '#f472b6', icon: 'M8 21h8M12 21v-8M7.5 4H4C4 8 6.5 11 10 12M16.5 4H20C20 8 17.5 11 14 12M7.5 4A4.5 4.5 0 0016.5 4V2h-9v2z' },
                ].map(({ label, color, icon, bars, grid }) => (
                  <div key={label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {bars ? (
                        <svg width="13" height="13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
                          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                      ) : grid ? (
                        <svg width="13" height="13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                          <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
                        </svg>
                      ) : (
                        <svg width="13" height="13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d={icon}/>
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.5 }} />
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <p className="text-center text-[10px] mt-6" style={{ color: 'rgba(156,163,175,0.3)' }}>
                By signing in you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
