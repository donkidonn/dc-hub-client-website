import { Router } from 'express'
import axios from 'axios'
import { requireAuth } from '../middleware/auth.js'
import supabase from '../db.js'
import { luarmorPost, luarmorPatch, luarmorGet } from '../luarmor.js'

const router = Router()
const PRICE_PER_HOUR = 1

// Create a new inactive Luarmor key for a user (auth_expire = 0).
// If the discord_id already exists in Luarmor, fetch and return their existing key.
async function createLuarmorKey(discord_id) {
  try {
    const data = await luarmorPost({ discord_id, auth_expire: 0 })
    return data.user_key
  } catch (createErr) {
    console.error('Luarmor create failed:', createErr.response?.data || createErr.message)
    // User may already exist in Luarmor — try fetching their key
    try {
      const list = await luarmorGet()
      const existing = list?.find?.(u => String(u.discord_id) === String(discord_id))
      if (existing?.user_key) return existing.user_key
    } catch (fetchErr) {
      console.error('Luarmor fetch fallback failed:', fetchErr.response?.data || fetchErr.message)
    }
    throw createErr
  }
}

// Activate (or extend) user's Luarmor key
async function activateLuarmorKey(user_key, auth_expire) {
  await luarmorPatch({ user_key, auth_expire })
}

// Deactivate user's Luarmor key (set auth_expire to 0)
async function deactivateLuarmorKey(user_key) {
  await luarmorPatch({ user_key, auth_expire: 0 })
}

// GET /api/slots — public, returns all slots with occupant info
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('slots')
    .select(`
      id,
      grand_id,
      expires_at,
      users ( discord_id, username, avatar_url )
    `)
    .order('grand_id', { ascending: true })

  if (error) return res.status(500).json({ error: 'Failed to fetch slots' })
  res.json(data)
})

// GET /api/slots/my-slot — return current user's active slot
router.get('/my-slot', requireAuth, async (req, res) => {
  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('user_id', req.user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  res.json(slot ?? null)
})

// POST /api/slots/acquire — buy a slot (activates the user's existing key)
router.post('/acquire', requireAuth, async (req, res) => {
  const { grand_id, hours } = req.body
  if (!grand_id || !hours || Number(hours) < 1) {
    return res.status(400).json({ error: 'grand_id and hours (min 1) are required' })
  }

  if (Number(grand_id) === 2) {
    return res.status(400).json({ error: 'Grand 2 is coming soon and not available yet' })
  }

  const cost = Number(hours) * PRICE_PER_HOUR

  // Check user doesn't already have an active slot
  const { data: existingSlot } = await supabase
    .from('slots')
    .select('id')
    .eq('user_id', req.user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existingSlot) {
    return res.status(400).json({ error: 'You already have an active slot. Extend it instead.' })
  }

  // Get user info
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('balance, discord_id, luarmor_key, total_hours')
    .eq('id', req.user.id)
    .single()

  if (userErr) return res.status(500).json({ error: 'Failed to fetch user' })

  // Auto-create a Luarmor key if the user doesn't have one yet
  if (!user.luarmor_key) {
    try {
      const newKey = await createLuarmorKey(user.discord_id)
      await supabase.from('users').update({ luarmor_key: newKey }).eq('id', req.user.id)
      user.luarmor_key = newKey
    } catch (err) {
      console.error('Failed to create Luarmor key:', err.response?.data || err.message)
      return res.status(500).json({ error: 'Failed to create your script key. Please try again.' })
    }
  }

  if (Number(user.balance) < cost) {
    return res.status(400).json({ error: `Insufficient balance. Need $${cost}, have $${user.balance}` })
  }

  // Find an available slot in the requested grand
  const { data: availableSlot } = await supabase
    .from('slots')
    .select('id')
    .eq('grand_id', grand_id)
    .is('user_id', null)
    .limit(1)
    .maybeSingle()

  if (!availableSlot) {
    return res.status(400).json({ error: 'No available slots in this Grand' })
  }

  const expires_at = new Date(Date.now() + Number(hours) * 60 * 60 * 1000)
  const auth_expire = Math.floor(expires_at.getTime() / 1000)

  // Activate the user's existing Luarmor key
  try {
    await activateLuarmorKey(user.luarmor_key, auth_expire)
  } catch (err) {
    const errDetail = err.response?.data ?? err.message
    console.error('Luarmor activate error (status', err.response?.status, '):', JSON.stringify(errDetail))
    return res.status(500).json({ error: 'Failed to activate script key' })
  }

  // Deduct balance and increment total_hours
  await supabase
    .from('users')
    .update({ balance: Number(user.balance) - cost, total_hours: (Number(user.total_hours) || 0) + Number(hours) })
    .eq('id', req.user.id)

  // Assign slot
  const { data: slot, error: slotErr } = await supabase
    .from('slots')
    .update({ user_id: req.user.id, expires_at: expires_at.toISOString() })
    .eq('id', availableSlot.id)
    .select()
    .single()

  if (slotErr) {
    console.error('Slot assignment error:', slotErr.message)
    return res.status(500).json({ error: 'Failed to assign slot' })
  }

  res.json({ slot, luarmor_key: user.luarmor_key })
})

// POST /api/slots/extend — add more hours (extends the key expiry)
router.post('/extend', requireAuth, async (req, res) => {
  const { hours } = req.body
  if (!hours || Number(hours) < 1) {
    return res.status(400).json({ error: 'hours (min 1) is required' })
  }

  const cost = Number(hours) * PRICE_PER_HOUR

  // Get user's active slot
  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('user_id', req.user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!slot) return res.status(400).json({ error: 'No active slot found' })

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('balance, discord_id, total_hours')
    .eq('id', req.user.id)
    .single()

  if (Number(user.balance) < cost) {
    return res.status(400).json({ error: `Insufficient balance. Need $${cost}, have $${user.balance}` })
  }

  // New expiry = current expiry + added hours
  const newExpiry = new Date(new Date(slot.expires_at).getTime() + Number(hours) * 60 * 60 * 1000)
  const auth_expire = Math.floor(newExpiry.getTime() / 1000)

  // Extend the key (same key, just push auth_expire forward)
  try {
    await activateLuarmorKey(user.luarmor_key, auth_expire)
  } catch (err) {
    console.error('Luarmor extend error:', err.response?.data || err.message)
    return res.status(500).json({ error: 'Failed to extend script key' })
  }

  // Deduct balance and increment total_hours
  await supabase
    .from('users')
    .update({ balance: Number(user.balance) - cost, total_hours: (Number(user.total_hours) || 0) + Number(hours) })
    .eq('id', req.user.id)

  // Update slot expiry
  const { data: updatedSlot } = await supabase
    .from('slots')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', slot.id)
    .select()
    .single()

  res.json({ slot: updatedSlot })
})

// POST /api/slots/reset-hwid — reset the user's Luarmor HWID
router.post('/reset-hwid', requireAuth, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('luarmor_key')
    .eq('id', req.user.id)
    .single()

  if (!user?.luarmor_key) return res.status(400).json({ error: 'No script key found on your account' })

  try {
    await luarmorPatch({ user_key: user.luarmor_key, hwid: '' })
    res.json({ ok: true })
  } catch (err) {
    console.error('HWID reset error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to reset HWID' })
  }
})

export default router
