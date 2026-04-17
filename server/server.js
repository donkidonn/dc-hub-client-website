import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import balanceRoutes from './routes/balance.js'
import slotsRoutes from './routes/slots.js'
import stealsRoutes from './routes/steals.js'
import leaderboardRoutes from './routes/leaderboard.js'
import supabase from './db.js'

const app = express()
const PORT = process.env.PORT || 3000

// CORS — only allow requests from the frontend
const allowedOrigin = (process.env.CLIENT_URL || '').replace(/\/$/, '')
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) or exact CLIENT_URL match
    if (!origin || origin === allowedOrigin) return callback(null, true)
    callback(new Error(`CORS blocked: ${origin}`))
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
        await axios.patch(
          `https://api.luarmor.net/v3/projects/${process.env.LUARMOR_PROJECT_ID}/users`,
          { user_key: slot.users.luarmor_key, auth_expire: 0 },
          { headers: { Authorization: process.env.LUARMOR_API_KEY } }
        )
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
