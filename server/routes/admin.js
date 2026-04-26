import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { luarmorPatch } from '../luarmor.js'
import { scheduleSlotCleanup, cancelAllScheduled } from '../slotCleanup.js'
import supabase from '../db.js'

const router = Router()

router.use(requireAuth, requireAdmin)

// GET /admin/status — system pause state
router.get('/status', async (req, res) => {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'paused_at')
    .single()
  res.json({ paused: !!data?.value, paused_at: data?.value ?? null })
})

// GET /admin/users — all users split into with/without keys
router.get('/users', async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id, discord_id, username, avatar_url, balance, luarmor_key, blacklisted, created_at,
      slots ( id, grand_id, expires_at )
    `)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Failed to fetch users' })

  const now = new Date().toISOString()
  const withKeys    = users.filter(u => u.luarmor_key)
  const withoutKeys = users.filter(u => !u.luarmor_key)

  // Attach active slot to each user
  const attach = (list) => list.map(u => ({
    ...u,
    active_slot: u.slots?.find(s => s.expires_at && s.expires_at > now) ?? null,
    slots: undefined,
  }))

  res.json({ with_keys: attach(withKeys), without_keys: attach(withoutKeys) })
})

// POST /admin/pause — deactivate all active Luarmor keys, record pause time
router.post('/pause', async (req, res) => {
  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'paused_at')
    .single()

  if (setting?.value) return res.status(400).json({ error: 'System is already paused' })

  const now = new Date().toISOString()

  // Cancel all cleanup timers so no slots get freed during the pause
  cancelAllScheduled()

  // Record pause time
  await supabase
    .from('system_settings')
    .update({ value: now })
    .eq('key', 'paused_at')

  res.json({ ok: true, paused_at: now })
})

// POST /admin/unpause — restore all keys with adjusted expiry
router.post('/unpause', async (req, res) => {
  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'paused_at')
    .single()

  if (!setting?.value) return res.status(400).json({ error: 'System is not paused' })

  const pausedAt  = new Date(setting.value)
  const now       = new Date()
  const timeLostMs = now - pausedAt

  // Get all slots that were active when paused
  const { data: slots } = await supabase
    .from('slots')
    .select('id, user_id, expires_at, users ( luarmor_key )')
    .gt('expires_at', pausedAt.toISOString())
    .not('user_id', 'is', null)

  const errors = []
  for (const slot of slots ?? []) {
    const newExpiry    = new Date(new Date(slot.expires_at).getTime() + timeLostMs)
    const auth_expire  = Math.floor(newExpiry.getTime() / 1000)

    // Update slot expiry in DB
    await supabase
      .from('slots')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', slot.id)

    // Reactivate Luarmor key with new expiry
    if (slot.users?.luarmor_key) {
      try {
        await luarmorPatch({ user_key: slot.users.luarmor_key, auth_expire })
      } catch (err) {
        errors.push(slot.users.luarmor_key)
      }
    }

    // Reschedule cleanup for the new expiry
    scheduleSlotCleanup(slot.id, slot.user_id, slot.users?.luarmor_key ?? null, newExpiry.toISOString())
  }

  // Clear pause state
  await supabase
    .from('system_settings')
    .update({ value: null })
    .eq('key', 'paused_at')

  res.json({ ok: true, affected: slots?.length ?? 0, failed_keys: errors })
})

// POST /admin/users/:userId/blacklist
router.post('/users/:userId/blacklist', async (req, res) => {
  const { userId } = req.params

  const { data: user } = await supabase
    .from('users')
    .select('luarmor_key')
    .eq('id', userId)
    .single()

  if (!user) return res.status(404).json({ error: 'User not found' })

  // Deactivate their key
  if (user.luarmor_key) {
    try { await luarmorPatch({ user_key: user.luarmor_key, auth_expire: 1 }) } catch {}
  }

  // Free their slot
  await supabase
    .from('slots')
    .update({ user_id: null, expires_at: null })
    .eq('user_id', userId)

  // Set blacklisted
  await supabase.from('users').update({ blacklisted: true }).eq('id', userId)

  res.json({ ok: true })
})

// POST /admin/users/:userId/unblacklist
router.post('/users/:userId/unblacklist', async (req, res) => {
  const { userId } = req.params
  await supabase.from('users').update({ blacklisted: false }).eq('id', userId)
  res.json({ ok: true })
})

// POST /admin/users/:userId/adjust-time — hours can be negative to reduce
router.post('/users/:userId/adjust-time', async (req, res) => {
  const { userId } = req.params
  const { hours }  = req.body

  if (!hours || isNaN(Number(hours))) {
    return res.status(400).json({ error: 'hours is required' })
  }

  const { data: user } = await supabase
    .from('users')
    .select('luarmor_key')
    .eq('id', userId)
    .single()

  if (!user?.luarmor_key) return res.status(400).json({ error: 'User has no key' })

  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!slot) return res.status(400).json({ error: 'User has no active slot' })

  const newExpiry   = new Date(new Date(slot.expires_at).getTime() + Number(hours) * 3600000)
  const auth_expire = Math.floor(newExpiry.getTime() / 1000)

  await luarmorPatch({ user_key: user.luarmor_key, auth_expire })

  await supabase
    .from('slots')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', slot.id)

  scheduleSlotCleanup(slot.id, slot.user_id, user.luarmor_key, newExpiry.toISOString())

  res.json({ ok: true, new_expires_at: newExpiry.toISOString() })
})

// POST /admin/users/:userId/adjust-balance — credit/debit user balance ($). amount can be negative.
router.post('/users/:userId/adjust-balance', async (req, res) => {
  const { userId } = req.params
  const { amount } = req.body

  const n = Number(amount)
  if (isNaN(n) || n === 0) {
    return res.status(400).json({ error: 'amount is required and must be non-zero' })
  }

  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single()

  if (!user) return res.status(404).json({ error: 'User not found' })

  const newBalance = Math.max(0, Number(user.balance) + n)

  await supabase.from('users').update({ balance: newBalance }).eq('id', userId)

  res.json({ ok: true, new_balance: newBalance })
})

// GET /admin/overview — KPI summary
router.get('/overview', async (req, res) => {
  const now = new Date().toISOString()

  const [usersRes, slotsRes, balanceRes, couponsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('slots').select('*', { count: 'exact', head: true }).gt('expires_at', now).not('user_id', 'is', null),
    supabase.from('users').select('balance'),
    supabase.from('coupons').select('expires_at, uses, max_uses'),
  ])

  const totalBalance = (balanceRes.data ?? []).reduce((sum, u) => sum + Number(u.balance || 0), 0)
  const activeCoupons = (couponsRes.data ?? []).filter(c =>
    (!c.expires_at || new Date(c.expires_at) > new Date()) && c.uses < c.max_uses
  ).length

  res.json({
    total_users:    usersRes.count ?? 0,
    active_slots:   slotsRes.count ?? 0,
    total_balance:  Number(totalBalance.toFixed(2)),
    active_coupons: activeCoupons,
  })
})

// GET /admin/coupons — list all coupons
router.get('/coupons', async (req, res) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, amount, max_uses, uses, expires_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Failed to fetch coupons' })
  res.json(data ?? [])
})

// POST /admin/coupons — create a coupon
router.post('/coupons', async (req, res) => {
  const { code, amount, max_uses, expires_at } = req.body

  const trimmedCode = String(code || '').trim().toUpperCase()
  if (!trimmedCode) return res.status(400).json({ error: 'code is required' })
  if (trimmedCode.length > 32) return res.status(400).json({ error: 'code too long (max 32 chars)' })

  const amt = Number(amount)
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'amount must be > 0' })

  const uses = Number(max_uses)
  if (!Number.isInteger(uses) || uses < 1) return res.status(400).json({ error: 'max_uses must be a positive integer' })

  const expiry = expires_at ? new Date(expires_at) : null
  if (expires_at && isNaN(expiry.getTime())) return res.status(400).json({ error: 'invalid expires_at' })

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: trimmedCode,
      amount: amt,
      max_uses: uses,
      uses: 0,
      expires_at: expiry ? expiry.toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Code already exists' })
    return res.status(500).json({ error: 'Failed to create coupon' })
  }

  res.json(data)
})

// DELETE /admin/coupons/:id — delete a coupon
router.delete('/coupons/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) return res.status(500).json({ error: 'Failed to delete coupon' })
  res.json({ ok: true })
})

// GET /admin/coupons/:id/redemptions — who redeemed this coupon
router.get('/coupons/:id/redemptions', async (req, res) => {
  const { data, error } = await supabase
    .from('coupon_redemptions')
    .select('id, redeemed_at, users ( id, discord_id, username, avatar_url )')
    .eq('coupon_id', req.params.id)
    .order('redeemed_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Failed to fetch redemptions' })
  res.json(data ?? [])
})

export default router
