import { useEffect, useRef, useContext } from 'react'
import { AnimationContext } from '../context/AnimationContext'

// Theme color palette [r, g, b]
const COLORS = [
  [139, 92,  246],  // purple
  [34,  211, 238],  // cyan
  [244, 114, 182],  // pink
  [168, 85,  247],  // violet
  [255, 255, 255],  // white
]

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function makeParticle(w, h) {
  return {
    x:            rand(0, w),
    y:            rand(0, h),
    vx:           rand(-0.12, 0.12),
    vy:           rand(-0.38, -0.08),
    size:         rand(0.6, 2.4),
    opacity:      rand(0.12, 0.55),
    opacityDir:   Math.random() > 0.5 ? 1 : -1,
    opacitySpeed: rand(0.003, 0.009),
    color:        COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

export default function ParticleCanvas() {
  const { animationsEnabled } = useContext(AnimationContext)
  const canvasRef = useRef(null)
  const stateRef  = useRef({ particles: [], raf: null, running: false })

  useEffect(() => {
    if (!animationsEnabled) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s   = stateRef.current

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = Math.min(75, Math.floor((window.innerWidth * window.innerHeight) / 14000))
    s.particles = Array.from({ length: COUNT }, () => makeParticle(canvas.width, canvas.height))
    s.running   = true

    function frame() {
      if (!s.running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Constellation lines
      for (let i = 0; i < s.particles.length; i++) {
        for (let j = i + 1; j < s.particles.length; j++) {
          const a  = s.particles[i]
          const b  = s.particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 120) * 0.1})`
            ctx.lineWidth   = 0.5
            ctx.stroke()
          }
        }
      }

      // Particles
      for (const p of s.particles) {
        // Twinkle
        p.opacity += p.opacityDir * p.opacitySpeed
        if (p.opacity >= 0.6 || p.opacity <= 0.08) p.opacityDir *= -1

        // Move
        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.y < -10)                  { p.y = canvas.height + 10; p.x = rand(0, canvas.width) }
        if (p.x < -10)                    p.x = canvas.width + 10
        if (p.x > canvas.width + 10)      p.x = -10

        const [r, g, b] = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`
        ctx.fill()
      }

      s.raf = requestAnimationFrame(frame)
    }

    frame()

    return () => {
      s.running = false
      if (s.raf) cancelAnimationFrame(s.raf)
      window.removeEventListener('resize', resize)
    }
  }, [animationsEnabled])

  if (!animationsEnabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
