import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import { luarmorPatch } from './luarmor.js'
import balanceRoutes from './routes/balance.js'
import slotsRoutes from './routes/slots.js'
import stealsRoutes from './routes/steals.js'
import leaderboardRoutes from './routes/leaderboard.js'
import supabase from './db.js'

const app = express()
const PORT = process.env.PORT || 3000

// Cloudflare IP ranges (IPv4 + IPv6)
const CF_RANGES = [
  '173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22',
  '141.101.64.0/18','108.162.192.0/18','190.93.240.0/20','188.114.96.0/20',
  '197.234.240.0/22','198.41.128.0/17','162.158.0.0/15','104.16.0.0/13',
  '104.24.0.0/14','172.64.0.0/13','131.0.72.0/22',
  '2400:cb00::/32','2606:4700::/32','2803:f800::/32','2405:b500::/32',
  '2405:8100::/32','2a06:98c0::/29','2c0f:f248::/32',
]

function ipInCidr(ip, cidr) {
  const [range, bits] = cidr.split('/')
  if (ip.includes(':') !== range.includes(':')) return false
  if (ip.includes(':')) {
    // Basic IPv6 check — expand and compare prefix
    try {
      const expand = s => {
        if (s.includes('::')) {
          const [l, r] = s.split('::')
          const lp = l ? l.split(':') : []
          const rp = r ? r.split(':') : []
          const fill = 8 - lp.length - rp.length
          return [...lp, ...Array(fill).fill('0'), ...rp].map(x => x.padStart(4,'0')).join('')
        }
        return s.split(':').map(x => x.padStart(4,'0')).join('')
      }
      const ipHex  = expand(ip)
      const rngHex = expand(range)
      const prefixChars = Math.ceil(Number(bits) / 4)
      return ipHex.slice(0, prefixChars) === rngHex.slice(0, prefixChars)
    } catch { return false }
  }
  // IPv4
  const toInt = s => s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0
  const mask  = bits === '32' ? 0xFFFFFFFF : (~(0xFFFFFFFF >>> Number(bits))) >>> 0
  return (toInt(ip) & mask) === (toInt(range) & mask)
}

function isCloudflareIP(ip) {
  return CF_RANGES.some(cidr => ipInCidr(ip, cidr))
}

// Block requests that bypass Cloudflare (direct Render URL hits)
// Skip in local dev so you can still test without Cloudflare
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next()
  const ip = (req.headers['cf-connecting-ip'] || req.ip || '').replace('::ffff:', '')
  if (req.headers['cf-connecting-ip'] || isCloudflareIP(ip)) return next()
  res.status(403).json({ error: 'Forbidden' })
})

// CORS — allow frontend origin(s)
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin header)
    if (!origin) return callback(null, true)
    // Allow any grandnotifier.online subdomain/root + localhost for dev
    if (origin.endsWith('grandnotifier.online') || origin.startsWith('http://localhost')) {
      return callback(null, true)
    }
    callback(null, false)
  },
  credentials: true,
}))

// Parse JSON bodies
app.use(express.json())

// Rate limiting — 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests. Please wait a moment.' }),
}))

// Routes
app.use('/auth', authRoutes)
app.use('/api/balance', balanceRoutes)
app.use('/api/slots', slotsRoutes)
app.use('/api/steals', stealsRoutes)
app.use('/api/leaderboard', leaderboardRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Temporary: reveals outbound IP so it can be whitelisted on Luarmor
app.get('/my-ip', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Slot expiry cleanup — runs every minute
// Deactivates Luarmor keys and frees slots when they expire
setInterval(async () => {
  const { data: expiredSlots, error } = await supabase
    .from('slots')
    .select('id, users ( luarmor_key )')
    .lt('expires_at', new Date().toISOString())
    .not('user_id', 'is', null)

  if (error) { console.error('Slot cleanup fetch error:', error.message); return }
  if (!expiredSlots?.length) return

  for (const slot of expiredSlots) {
    // Deactivate Luarmor key
    if (slot.users?.luarmor_key) {
      try {
        await luarmorPatch({ user_key: slot.users.luarmor_key, auth_expire: 0 })
      } catch (err) {
        console.error(`Failed to deactivate key for slot ${slot.id}:`, err.message)
      }
    }

    // Free the slot in DB
    await supabase
      .from('slots')
      .update({ user_id: null, expires_at: null })
      .eq('id', slot.id)
  }
}, 60 * 1000)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
