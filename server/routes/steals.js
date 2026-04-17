import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import supabase from '../db.js'

const router = Router()

// POST /api/steals — record a steal (called by Roblox script)
// Identifies user by their luarmor_key
router.post('/', async (req, res) => {
  const { luarmor_key, item_name, tier, amount } = req.body
  if (!luarmor_key || !item_name || !tier) {
    return res.status(400).json({ error: 'luarmor_key, item_name and tier are required' })
  }

  // Find user by luarmor_key
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('luarmor_key', luarmor_key)
    .maybeSingle()

  if (!user) return res.status(404).json({ error: 'Invalid key' })

  // Verify user has an active slot
  const { data: slot } = await supabase
    .from('slots')
    .select('id')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!slot) return res.status(403).json({ error: 'No active slot' })

  const { error } = await supabase.from('steals').insert({
    user_id: user.id,
    item_name,
    tier: tier.toLowerCase(),
    amount: Number(amount) || 0,
  })

  if (error) return res.status(500).json({ error: 'Failed to record steal' })
  res.json({ ok: true })
})

// GET /api/steals/recent — last 20 steals across all users (public, for live feed)
router.get('/recent', async (req, res) => {
  const { data, error } = await supabase
    .from('steals')
    .select('id, item_name, tier, amount, timestamp, users(username, avatar_url)')
    .order('timestamp', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: 'Failed to fetch steals' })
  res.json(data)
})

// GET /api/steals/my-stats — current user's tier counts + top 3 items
router.get('/my-stats', requireAuth, async (req, res) => {
  const { data: steals } = await supabase
    .from('steals')
    .select('tier, item_name, amount')
    .eq('user_id', req.user.id)

  if (!steals) return res.json({ counts: {}, topItems: [], totalSteals: 0 })

  // Count by tier
  const counts = { og: 0, best: 0, legendary: 0, high: 0 }
  const itemMap = {}

  steals.forEach(({ tier, item_name }) => {
    const t = tier?.toLowerCase()
    if (counts[t] !== undefined) counts[t]++

    if (item_name) {
      if (!itemMap[item_name]) itemMap[item_name] = { name: item_name, count: 0, tier }
      itemMap[item_name].count++
    }
  })

  // Top 3 stolen items
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item, i) => ({ ...item, rank: i + 1 }))

  res.json({ counts, topItems, totalSteals: steals.length })
})

// GET /api/steals/my-history — current user's recent steal history
router.get('/my-history', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('steals')
    .select('id, item_name, tier, amount, timestamp')
    .eq('user_id', req.user.id)
    .order('timestamp', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: 'Failed to fetch history' })
  res.json(data)
})

// GET /api/steals/chart — last 24h hourly steal data for current user
router.get('/chart', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: steals } = await supabase
    .from('steals')
    .select('tier, timestamp')
    .eq('user_id', req.user.id)
    .gte('timestamp', since)

  // Build 24 hour buckets
  const buckets = {}
  for (let i = 23; i >= 0; i--) {
    const label = i === 0 ? 'Now' : `-${i}h`
    buckets[i] = { time: label, og: 0, legendary: 0, bestTier: 0, highTier: 0 }
  }

  steals?.forEach(({ tier, timestamp }) => {
    const hoursAgo = Math.floor((Date.now() - new Date(timestamp)) / (60 * 60 * 1000))
    if (hoursAgo >= 0 && hoursAgo <= 23) {
      const b = buckets[hoursAgo]
      const t = tier?.toLowerCase()
      if (t === 'og') b.og++
      else if (t === 'legendary') b.legendary++
      else if (t === 'best') b.bestTier++
      else if (t === 'high') b.highTier++
    }
  })

  res.json(Object.values(buckets).reverse())
})

// GET /api/steals/global-chart — aggregate hourly steal data for all users (last 24h)
router.get('/global-chart', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: steals } = await supabase
    .from('steals')
    .select('tier, timestamp')
    .gte('timestamp', since)

  const buckets = {}
  for (let i = 23; i >= 0; i--) {
    buckets[i] = { time: i === 0 ? 'Now' : `-${i}h`, og: 0, legend: 0, best: 0, high: 0 }
  }

  steals?.forEach(({ tier, timestamp }) => {
    const hoursAgo = Math.floor((Date.now() - new Date(timestamp)) / (60 * 60 * 1000))
    if (hoursAgo >= 0 && hoursAgo <= 23) {
      const b = buckets[hoursAgo]
      const t = tier?.toLowerCase()
      if (t === 'og')        b.og++
      else if (t === 'legendary') b.legend++
      else if (t === 'best') b.best++
      else if (t === 'high') b.high++
    }
  })

  res.json(Object.values(buckets).reverse())
})

// GET /api/steals/global-stats — aggregate tier counts for all users (all time)
router.get('/global-stats', requireAuth, async (req, res) => {
  const { data: steals } = await supabase.from('steals').select('tier')

  const counts = { og: 0, legend: 0, best: 0, high: 0 }
  steals?.forEach(({ tier }) => {
    const t = tier?.toLowerCase()
    if (t === 'og')        counts.og++
    else if (t === 'legendary') counts.legend++
    else if (t === 'best') counts.best++
    else if (t === 'high') counts.high++
  })

  res.json(counts)
})

// GET /api/deposits/history — current user's deposit history
router.get('/deposits', requireAuth, async (req, res) => {
  // Auto-expire pending deposits older than 30 minutes (NowPayments default window)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  await supabase
    .from('deposits')
    .update({ status: 'expired' })
    .eq('user_id', req.user.id)
    .eq('status', 'pending')
    .lt('created_at', thirtyMinsAgo)

  const { data, error } = await supabase
    .from('deposits')
    .select('id, amount, crypto, status, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: 'Failed to fetch deposits' })
  res.json(data)
})

export default router
