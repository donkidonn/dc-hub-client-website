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
