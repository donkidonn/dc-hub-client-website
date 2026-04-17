import { Router } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import supabase from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Creates an inactive Luarmor key (auth_expire = 0) for a new user
async function createInactiveLuarmorKey(discord_id) {
  const { data } = await axios.post(
    `https://api.luarmor.net/v3/projects/${process.env.LUARMOR_PROJECT_ID}/users`,
    { discord_id, auth_expire: 0 },
    { headers: { Authorization: process.env.LUARMOR_API_KEY } }
  )
  return data.user_key
}

// GET /auth/discord — redirect user to Discord OAuth
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  })
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
})

// GET /auth/discord/callback — exchange code, upsert user, return JWT
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query
  if (!code) return res.redirect(`${process.env.CLIENT_URL}/auth?error=no_code`)

  try {
    // Exchange code for Discord access token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const { access_token } = tokenRes.data

    // Fetch Discord user profile
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    const { id: discord_id, username, avatar } = userRes.data
    const avatar_url = avatar
      ? `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.png`
      : null

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, luarmor_key')
      .eq('discord_id', discord_id)
      .maybeSingle()

    let luarmor_key = existing?.luarmor_key ?? null

    // New user — create an inactive Luarmor key for them
    if (!existing) {
      try {
        luarmor_key = await createInactiveLuarmorKey(discord_id)
      } catch (err) {
        console.error('Failed to create Luarmor key for new user:', err.message)
        // Don't block registration if Luarmor is down
      }
    }

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        { discord_id, username, avatar_url, ...(luarmor_key ? { luarmor_key } : {}) },
        { onConflict: 'discord_id' }
      )
      .select()
      .single()

    if (error) throw error

    // Sign JWT (expires in 7 days)
    const token = jwt.sign(
      { id: user.id, discord_id: user.discord_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`)
  } catch (err) {
    console.error('Discord callback error:', err.message)
    res.redirect(`${process.env.CLIENT_URL}/auth?error=auth_failed`)
  }
})

// GET /auth/me — return current logged-in user (includes luarmor_key)
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
