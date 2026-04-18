import { Router } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import supabase from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const exchangeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res) => res.status(429).json({ error: 'Too many login attempts. Please wait.' }),
})

// Shared helper — exchange Discord code + upsert user + return JWT
async function exchangeCodeForToken(code, redirectUri) {
  const tokenRes = await axios.post(
    'https://discord.com/api/oauth2/token',
    new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  const { access_token } = tokenRes.data

  const userRes = await axios.get('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  const { id: discord_id, username, avatar } = userRes.data
  const avatar_url = avatar
    ? `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.png`
    : null

  const { data: user, error } = await supabase
    .from('users')
    .upsert(
      { discord_id, username, avatar_url },
      { onConflict: 'discord_id' }
    )
    .select()
    .single()

  if (error) throw error

  return jwt.sign(
    { id: user.id, discord_id: user.discord_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// GET /auth/discord — redirect user to Discord OAuth (redirect_uri points to frontend)
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  })
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
})

// POST /auth/discord/exchange — frontend sends the code, we return a JWT
router.post('/discord/exchange', exchangeLimit, async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'No code provided' })

  try {
    const token = await exchangeCodeForToken(code, process.env.DISCORD_REDIRECT_URI)
    res.json({ token })
  } catch (err) {
    console.error('Discord exchange error:', err.message)
    res.status(401).json({ error: 'Authentication failed' })
  }
})

// GET /auth/me — return current logged-in user
router.get('/me', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, discord_id, username, avatar_url, balance, luarmor_key, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

export default router
