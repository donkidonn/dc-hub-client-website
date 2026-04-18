import supabase from './db.js'
import { luarmorDelete } from './luarmor.js'

const scheduled = new Map() // slotId -> timeoutId

export async function runSlotCleanup(slotId, userId, luarmorKey) {
  console.log(`[CLEANUP] Running for slot ${slotId}`)

  if (luarmorKey) {
    try {
      await luarmorDelete(luarmorKey)
      console.log(`[CLEANUP] Luarmor key deleted for slot ${slotId}`)
      await supabase.from('users').update({ luarmor_key: null }).eq('id', userId)
    } catch (err) {
      console.error(`[CLEANUP] Failed to delete Luarmor key for slot ${slotId}:`, err.response?.data || err.message)
    }
  }

  const { error } = await supabase
    .from('slots')
    .update({ user_id: null, expires_at: null })
    .eq('id', slotId)

  if (error) console.error(`[CLEANUP] Failed to free slot ${slotId}:`, error.message)
  else console.log(`[CLEANUP] Slot ${slotId} freed`)

  scheduled.delete(slotId)
}

export function scheduleSlotCleanup(slotId, userId, luarmorKey, expiresAt) {
  // Cancel existing timeout if rescheduling (e.g. on extend)
  if (scheduled.has(slotId)) {
    clearTimeout(scheduled.get(slotId))
    console.log(`[CLEANUP] Rescheduled slot ${slotId}`)
  }

  const delay = new Date(expiresAt) - Date.now()

  if (delay <= 0) {
    runSlotCleanup(slotId, userId, luarmorKey)
    return
  }

  console.log(`[CLEANUP] Slot ${slotId} cleanup scheduled in ${Math.round(delay / 1000)}s`)
  const id = setTimeout(() => runSlotCleanup(slotId, userId, luarmorKey), delay)
  scheduled.set(slotId, id)
}
