import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { luarmorPatch } from '../luarmor.js'
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

  // Get all active slots with their users' keys
  const { data: activeSlots } = await supabase
    .from('slots')
    .select('id, expires_at, users ( luarmor_key )')
    .gt('expires_at', now)
    .not('user_id', 'is', null)

  // Deactivate all active Luarmor keys
  const errors = []
  for (const slot of activeSlots ?? []) {
    if (slot.users?.luarmor_key) {
      try {
        await luarmorPatch({ user_key: slot.users.luarmor_key, auth_expire: 1 })
      } catch (err) {
        errors.push(slot.users.luarmor_key)
      }
    }
  }

  // Record pause time
  await supabase
    .from('system_settings')
    .update({ value: now })
    .eq('key', 'paused_at')

  res.json({ ok: true, paused_at: now, failed_keys: errors })
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
    .select('id, expires_at, users ( luarmor_key )')
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

  res.json({ ok: true, new_expires_at: newExpiry.toISOString() })
})

export default router
