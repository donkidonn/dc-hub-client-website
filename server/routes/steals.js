import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import supabase from '../db.js'

const router = Router()

// POST /api/steals — record a steal (called by Roblox script)
// Identifies user by their luarmor_key
router.post('/', async (req, res) => {
  const { luarmor_key, item_name, tier, amount, mutation, rarity } = req.body
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
    mutation: mutation || null,
    rarity: rarity || null,
  })

  if (error) return res.status(500).json({ error: 'Failed to record steal' })
  res.json({ ok: true })
})

// GET /api/steals/recent — last 20 steals across all users (public, for live feed)
router.get('/recent', async (req, res) => {
  const { data, error } = await supabase
    .from('steals')
    .select('id, item_name, tier, amount, mutation, rarity, timestamp, users(username, avatar_url)')
    .order('timestamp', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: 'Failed to fetch steals' })

  // Batch-fetch images for all unique item names
  const names = [...new Set(data.map(s => s.item_name).filter(Boolean))]
  let imageMap = {}
  if (names.length > 0) {
    const { data: imgs } = await supabase
      .from('brainrot-image-links')
      .select('brainrot_name, brainrot_imglink')
      .in('brainrot_name', names)
    imgs?.forEach(r => { imageMap[r.brainrot_name] = r.brainrot_imglink })
  }

  const enriched = data.map(s => ({
    ...s,
    image_url: imageMap[s.item_name] || null,
  }))

  res.json(enriched)
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

  steals.forEach(({ tier, item_name, amount }) => {
    const t = tier?.toLowerCase()
    if (counts[t] !== undefined) counts[t]++

    if (item_name) {
      if (!itemMap[item_name]) itemMap[item_name] = { name: item_name, count: 0, tier, amount: 0 }
      itemMap[item_name].count++
      if (Number(amount) > itemMap[item_name].amount) itemMap[item_name].amount = Number(amount)
    }
  })

  // Top 3 stolen items
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item, i) => ({ ...item, rank: i + 1 }))

  // Attach image URLs
  const names = topItems.map(i => i.name)
  if (names.length > 0) {
    const { data: imgs } = await supabase
      .from('brainrot-image-links')
      .select('brainrot_name, brainrot_imglink')
      .in('brainrot_name', names)
    const imageMap = {}
    imgs?.forEach(r => { imageMap[r.brainrot_name] = r.brainrot_imglink })
    topItems.forEach(item => { item.image_url = imageMap[item.name] || null })
  }

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

  // Batch-fetch images
  const names = [...new Set(data.map(s => s.item_name).filter(Boolean))]
  let imageMap = {}
  if (names.length > 0) {
    const { data: imgs } = await supabase
      .from('brainrot-image-links')
      .select('brainrot_name, brainrot_imglink')
      .in('brainrot_name', names)
    imgs?.forEach(r => { imageMap[r.brainrot_name] = r.brainrot_imglink })
  }

  res.json(data.map(s => ({ ...s, image_url: imageMap[s.item_name] || null })))
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

// GET /api/steals/global-chart — aggregate hourly brainrot finds for all users (last 24h)
router.get('/global-chart', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: rows } = await supabase
    .from('brainrots')
    .select('tier, created_at')
    .gte('created_at', since)

  const buckets = {}
  for (let i = 23; i >= 0; i--) {
    buckets[i] = { time: i === 0 ? 'Now' : `-${i}h`, og: 0, legend: 0, best: 0, high: 0 }
  }

  rows?.forEach(({ tier, created_at }) => {
    const hoursAgo = Math.floor((Date.now() - new Date(created_at)) / (60 * 60 * 1000))
    if (hoursAgo >= 0 && hoursAgo <= 23) {
      const b = buckets[hoursAgo]
      const t = tier?.toLowerCase()
      if      (t === 'og')          b.og++
      else if (t === 'beyondbest')  b.best++
      else if (t === 'big')         b.legend++
      else if (t === 'high')        b.high++
      // 'low' is skipped — below display threshold
    }
  })

  res.json(Object.values(buckets).reverse())
})

// GET /api/steals/global-stats — aggregate brainrot find counts by tier (all time)
router.get('/global-stats', requireAuth, async (req, res) => {
  const { data: rows } = await supabase.from('brainrots').select('tier')

  const counts = { og: 0, legend: 0, best: 0, high: 0 }
  rows?.forEach(({ tier }) => {
    const t = tier?.toLowerCase()
    if      (t === 'og')         counts.og++
    else if (t === 'beyondbest') counts.best++
    else if (t === 'big')        counts.legend++
    else if (t === 'high')       counts.high++
    // 'low' skipped
  })

  res.json(counts)
})

// GET /api/steals/brainrots-chart — last 24h hourly brainrot finds (for Statistics page chart)
router.get('/brainrots-chart', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: rows } = await supabase
    .from('brainrots')
    .select('tier, created_at')
    .gte('created_at', since)

  const buckets = {}
  for (let i = 23; i >= 0; i--) {
    buckets[i] = { time: i === 0 ? 'Now' : `-${i}h`, og: 0, legendary: 0, bestTier: 0, highTier: 0 }
  }

  rows?.forEach(({ tier, created_at }) => {
    const hoursAgo = Math.floor((Date.now() - new Date(created_at)) / (60 * 60 * 1000))
    if (hoursAgo >= 0 && hoursAgo <= 23) {
      const b = buckets[hoursAgo]
      const t = tier?.toLowerCase()
      if      (t === 'og')         b.og++
      else if (t === 'beyondbest') b.bestTier++
      else if (t === 'big')        b.legendary++
      else if (t === 'high')       b.highTier++
    }
  })

  res.json(Object.values(buckets).reverse())
})

// GET /api/steals/brainrots-stats — tier counts from brainrots table (for Statistics KPI cards)
router.get('/brainrots-stats', requireAuth, async (req, res) => {
  const { data: rows } = await supabase.from('brainrots').select('tier')

  const counts = { og: 0, best: 0, legendary: 0, high: 0 }
  rows?.forEach(({ tier }) => {
    const t = tier?.toLowerCase()
    if      (t === 'og')         counts.og++
    else if (t === 'beyondbest') counts.best++
    else if (t === 'big')        counts.legendary++
    else if (t === 'high')       counts.high++
  })

  res.json(counts)
})

// GET /api/steals/brainrots-recent?tier=og|best|legendary — recent brainrot finds by tier
router.get('/brainrots-recent', requireAuth, async (req, res) => {
  const TIER_MAP = { og: 'og', best: 'beyondbest', legendary: 'big' }
  const dbTier = TIER_MAP[req.query.tier]
  if (!dbTier) return res.status(400).json({ error: 'Invalid tier' })

  const { data, error } = await supabase
    .from('brainrots')
    .select('id, name, tier, raw_value, created_at')
    .eq('tier', dbTier)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: 'Failed to fetch' })
  res.json(data)
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
