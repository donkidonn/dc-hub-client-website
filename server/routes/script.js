import { Router } from 'express'
import supabase from '../db.js'
import { requireScriptAuth } from '../middleware/auth.js'

const router = Router()

// Per-user join cooldown (userId -> lastJoinTimestamp)
const joinCooldowns = new Map()

// GET /api/script/brainrots?lastId=X&since=Y
router.get('/brainrots', requireScriptAuth, async (req, res) => {
  const { lastId, since } = req.query

  let query = supabase
    .from('brainrots')
    .select('id, name, raw_value, rarity, mutation, price, created_at')
    .order('id', { ascending: true })

  if (lastId) {
    query = query.gt('id', parseInt(lastId))
  } else if (since) {
    query = query.gte('created_at', since)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch brainrots' })
  res.json(data ?? [])
})

// POST /api/script/join — returns server_id for a steal (rate limited, time-limited)
router.post('/join', requireScriptAuth, async (req, res) => {
  const { steal_id } = req.body
  if (!steal_id) return res.status(400).json({ error: 'steal_id required' })

  const lastJoin = joinCooldowns.get(req.user.id)
  const now = Date.now()
  if (lastJoin && now - lastJoin < 5000) {
    return res.status(429).json({ error: 'Please wait before joining again' })
  }
  joinCooldowns.set(req.user.id, now)

  const { data: steal } = await supabase
    .from('brainrots')
    .select('server_id, created_at')
    .eq('id', steal_id)
    .single()

  if (!steal?.server_id) return res.status(404).json({ error: 'Steal not found' })

  const ageSeconds = (Date.now() - new Date(steal.created_at).getTime()) / 1000
  if (ageSeconds > 60) return res.status(410).json({ error: 'Server ID expired' })

  res.json({ server_id: steal.server_id })
})

// POST /api/script/steals — log a steal
router.post('/steals', requireScriptAuth, async (req, res) => {
  const { item_name, tier, amount, mutation, rarity, timestamp } = req.body
  if (!item_name || !tier || !amount) return res.status(400).json({ error: 'Missing fields' })

  await supabase.from('steals').insert({
    user_id: req.user.id,
    item_name,
    tier,
    amount,
    mutation: mutation || null,
    rarity: rarity || null,
    timestamp: timestamp || new Date().toISOString()
  })

  res.json({ ok: true })
})

// GET /api/script/active-users
router.get('/active-users', requireScriptAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('active_users')
    .select('roblox_id, username')

  if (error) return res.status(500).json({ error: 'Failed to fetch users' })
  res.json(data ?? [])
})

// POST /api/script/active-users/register
router.post('/active-users/register', requireScriptAuth, async (req, res) => {
  const { roblox_id, username } = req.body
  if (!roblox_id) return res.status(400).json({ error: 'roblox_id required' })

  await supabase.from('active_users').upsert({
    roblox_id: String(roblox_id),
    discord_id: req.user.discord_id,
    username: username || 'Unknown',
    updated_at: new Date().toISOString()
  }, { onConflict: 'roblox_id' })

  res.json({ ok: true })
})

// GET /api/script/brainrot-image?name=X
router.get('/brainrot-image', requireScriptAuth, async (req, res) => {
  const { name } = req.query
  if (!name) return res.status(400).json({ error: 'name required' })

  const { data } = await supabase
    .from('brainrot-image-links')
    .select('brainrot_imglink')
    .eq('brainrot_name', name)
    .maybeSingle()

  res.json({ url: data?.brainrot_imglink ?? null })
})

export default router
