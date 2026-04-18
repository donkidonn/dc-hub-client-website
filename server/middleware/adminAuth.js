export function requireAdmin(req, res, next) {
  const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean)
  if (!adminIds.includes(String(req.user.discord_id))) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
