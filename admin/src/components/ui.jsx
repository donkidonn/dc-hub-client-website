// Shared UI primitives — neon-outline aesthetic matching the client site

const ACCENTS = {
  cyan:    { hex: '#22d3ee', glow: 'rgba(34,211,238,0.45)',  soft: 'rgba(34,211,238,0.10)',  line: 'rgba(34,211,238,0.22)' },
  violet:  { hex: '#a855f7', glow: 'rgba(168,85,247,0.50)',  soft: 'rgba(168,85,247,0.10)',  line: 'rgba(168,85,247,0.24)' },
  magenta: { hex: '#f472b6', glow: 'rgba(244,114,182,0.45)', soft: 'rgba(244,114,182,0.10)', line: 'rgba(244,114,182,0.24)' },
  green:   { hex: '#34d399', glow: 'rgba(52,211,153,0.45)',  soft: 'rgba(52,211,153,0.10)',  line: 'rgba(52,211,153,0.24)' },
  red:     { hex: '#f87171', glow: 'rgba(248,113,113,0.45)', soft: 'rgba(248,113,113,0.10)', line: 'rgba(248,113,113,0.26)' },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.45)',  soft: 'rgba(245,158,11,0.10)',  line: 'rgba(245,158,11,0.26)' },
}

/** Panel — sharp-cornered card with neon top-edge glow that fades from the sides. */
export function Panel({ children, className = '', accent = 'cyan', style = {}, padding }) {
  const a = ACCENTS[accent] ?? ACCENTS.cyan
  return (
    <div
      className={`relative rounded-[12px] ${className}`}
      style={{
        background: 'rgba(6,7,11,0.55)',
        border: `1px solid ${a.line}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.025), 0 1px 0 ${a.line}`,
        backdropFilter: 'blur(10px)',
        padding,
        ...style,
      }}>
      {/* Top edge neon line */}
      <div aria-hidden style={{
        position: 'absolute', top: -1, left: '8%', right: '8%', height: 1,
        background: `linear-gradient(90deg, transparent, ${a.hex} 50%, transparent)`,
        boxShadow: `0 0 12px ${a.glow}`,
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

/** PanelHeader — title + optional subtitle + right slot, with bottom hairline. */
export function PanelHeader({ title, subtitle, right, eyebrow }) {
  return (
    <div className="px-7 py-5 flex items-center justify-between flex-wrap gap-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h3 className="text-[17px] font-bold tracking-tight text-white leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'rgba(156,163,175,0.6)' }}>{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

/** Tag — colored pill, used for status badges. */
export function Tag({ children, color = 'cyan' }) {
  const a = typeof color === 'string' && ACCENTS[color] ? ACCENTS[color] : null
  const hex  = a ? a.hex  : color
  const soft = a ? a.soft : `${color}1a`
  const line = a ? a.line : `${color}40`
  return (
    <span className="text-[11px] font-black px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 tracking-[0.08em] uppercase"
      style={{ background: soft, color: hex, border: `1px solid ${line}` }}>
      {children}
    </span>
  )
}

/** Button — variants: solid (violet CTA), cyan, ghost, danger, success. */
export function Button({ children, variant = 'cyan', disabled, onClick, className = '', style = {}, type = 'button', title, size = 'md' }) {
  const variants = {
    solid:   { bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', fg: '#fff', br: 'rgba(168,85,247,0.5)', hov: 'linear-gradient(135deg,#b66bff,#8a45f0)', glow: '0 0 20px rgba(168,85,247,0.35)' },
    cyan:    { bg: 'rgba(34,211,238,0.06)', fg: '#22d3ee', br: 'rgba(34,211,238,0.3)', hov: 'rgba(34,211,238,0.14)', glow: 'none' },
    ghost:   { bg: 'transparent',           fg: 'rgba(196,181,253,0.65)', br: 'rgba(255,255,255,0.07)', hov: 'rgba(255,255,255,0.04)', glow: 'none' },
    danger:  { bg: 'rgba(248,113,113,0.06)', fg: '#f87171', br: 'rgba(248,113,113,0.3)', hov: 'rgba(248,113,113,0.14)', glow: 'none' },
    success: { bg: 'rgba(52,211,153,0.06)',  fg: '#34d399', br: 'rgba(52,211,153,0.3)', hov: 'rgba(52,211,153,0.14)', glow: 'none' },
  }
  const v     = variants[variant] ?? variants.cyan
  const sizes = {
    sm: 'px-3   py-1.5 text-[12px]',
    md: 'px-4   py-2.5 text-[13px]',
    lg: 'px-6   py-3   text-[14px]',
  }
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${sizes[size]} rounded-[8px] font-bold tracking-wide transition-all duration-150 active:scale-[0.97] uppercase ${className}`}
      style={{
        background: v.bg,
        color: v.fg,
        border: `1px solid ${v.br}`,
        boxShadow: v.glow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        letterSpacing: '0.04em',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = v.hov }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = v.bg }}>
      {children}
    </button>
  )
}

/** Input — thin cyan-on-black with focus glow. */
export function Input({ value, onChange, placeholder, type = 'text', className = '', style = {}, onKeyDown, maxLength, mono = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`${mono ? 'mono' : ''} w-full px-4 py-3 rounded-[8px] text-[14px] font-medium text-white placeholder:text-[rgba(156,163,175,0.35)] outline-none transition-all duration-150 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        colorScheme: 'dark',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(34,211,238,0.55)'
        e.target.style.boxShadow   = '0 0 0 3px rgba(34,211,238,0.08), inset 0 0 0 1px rgba(34,211,238,0.18)'
        e.target.style.background  = 'rgba(34,211,238,0.025)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.07)'
        e.target.style.boxShadow   = 'none'
        e.target.style.background  = 'rgba(255,255,255,0.025)'
      }}
    />
  )
}

/** Avatar — cyan-rim if image, gradient fallback. */
export function Avatar({ url, size = 36 }) {
  const ringSize = size + 4
  if (url) return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: ringSize, height: ringSize,
        background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.4), rgba(168,85,247,0.2) 70%)',
        padding: 1.5,
      }}>
      <img src={url} alt="" className="rounded-full object-cover w-full h-full"
        style={{ background: '#000' }} />
    </div>
  )
  return (
    <div className="rounded-full flex-shrink-0 flex items-center justify-center"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg,rgba(168,85,247,0.4),rgba(34,211,238,0.2))',
        border: '1.5px solid rgba(34,211,238,0.45)',
      }}>
      <svg width={size * 0.5} height={size * 0.5} fill="rgba(196,181,253,0.7)" viewBox="0 0 24 24">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z" />
      </svg>
    </div>
  )
}

/** EmptyState — centered icon + message. */
export function EmptyState({ message, hint, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(34,211,238,0.04)',
          border: '1px solid rgba(34,211,238,0.18)',
        }}>
        <div aria-hidden className="absolute inset-0 rounded-full pulse"
          style={{ boxShadow: '0 0 28px rgba(34,211,238,0.22)' }} />
        {icon ?? (
          <svg width="26" height="26" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth="1.6" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <div className="text-center">
        <p className="text-[14.5px] font-bold" style={{ color: 'rgba(196,181,253,0.75)' }}>{message}</p>
        {hint && <p className="text-[13px] mt-1.5" style={{ color: 'rgba(156,163,175,0.45)' }}>{hint}</p>}
      </div>
    </div>
  )
}

/** FlashMessage — inline status feedback. */
export function FlashMessage({ msg }) {
  if (!msg) return null
  return (
    <p className="text-[12px] font-bold inline-flex items-center gap-2 uppercase tracking-wide"
      style={{ color: msg.ok ? '#34d399' : '#f87171', letterSpacing: '0.06em' }}>
      <span className="w-2 h-2 rounded-full"
        style={{
          background: msg.ok ? '#34d399' : '#f87171',
          boxShadow: `0 0 10px ${msg.ok ? '#34d399' : '#f87171'}`,
        }} />
      {msg.text}
    </p>
  )
}

/** FieldLabel — small caps label above an input. */
export function FieldLabel({ children }) {
  return (
    <label className="eyebrow">
      {children}
    </label>
  )
}

/** PageHeader — page title + subtitle, optional right slot for global actions. */
export function PageHeader({ title, subtitle, eyebrow, right }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-black text-white tracking-tight leading-[1.05]"
          style={{ fontSize: 'var(--display)', letterSpacing: '-0.025em' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 leading-relaxed max-w-prose"
            style={{ fontSize: 15, color: 'rgba(156,163,175,0.65)' }}>{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

/** Stat — large display number with eyebrow + optional sublabel. */
export function Stat({ label, value, sub, accent = 'cyan', icon, loading }) {
  const a = ACCENTS[accent] ?? ACCENTS.cyan
  return (
    <Panel accent={accent} className="overflow-hidden">
      {/* Corner glow */}
      <div aria-hidden style={{
        position: 'absolute', top: -50, right: -50, width: 140, height: 140,
        background: `radial-gradient(circle, ${a.soft}, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div className="p-6 flex flex-col gap-4 relative">
        <div className="flex items-start justify-between">
          <p className="eyebrow">{label}</p>
          {icon && (
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center"
              style={{ background: a.soft, border: `1px solid ${a.line}`, color: a.hex }}>
              {icon}
            </div>
          )}
        </div>
        <p className="font-black tabular-nums leading-none tracking-tight"
          style={{
            fontSize: 'clamp(38px, 3.6vw, 50px)',
            color: loading ? 'rgba(255,255,255,0.12)' : a.hex,
            textShadow: loading ? 'none' : `0 0 24px ${a.glow}`,
            letterSpacing: '-0.03em',
          }}>
          {loading ? '··' : value}
        </p>
        {sub && (
          <p className="text-[12.5px]" style={{ color: 'rgba(156,163,175,0.55)' }}>{sub}</p>
        )}
      </div>
    </Panel>
  )
}

/** SectionDivider — centered tracked-out caps with hairlines. Like "TOP STEALS". */
export function SectionDivider({ children }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
      <p className="eyebrow">{children}</p>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
    </div>
  )
}

/* -------- formatters -------- */

export function formatTimeLeft(ms) {
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatRelativeDate(iso) {
  if (!iso) return '—'
  const ts = iso.endsWith && !iso.endsWith('Z') && !iso.includes('+') ? iso + 'Z' : iso
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
