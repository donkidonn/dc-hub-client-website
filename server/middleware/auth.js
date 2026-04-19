import jwt from 'jsonwebtoken'
import supabase from '../db.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    const { data: user } = await supabase
      .from('users')
      .select('blacklisted')
      .eq('id', req.user.id)
      .single()
    if (user?.blacklisted) {
      return res.status(403).json({ error: 'Your account has been suspended.' })
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function requireScriptAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const timestamp = parseInt(req.headers['x-timestamp'])
  const now = Math.floor(Date.now() / 1000)
  if (!timestamp || Math.abs(now - timestamp) > 30) {
    return res.status(401).json({ error: 'Request expired' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'script') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, discord_id, username, blacklisted')
      .eq('id', decoded.id)
      .single()

    if (!user) return res.status(401).json({ error: 'User not found' })
    if (user.blacklisted) return res.status(403).json({ error: 'Account suspended' })

    const { data: slot } = await supabase
      .from('slots')
      .select('id')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!slot) return res.status(403).json({ error: 'No active slot' })

    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
