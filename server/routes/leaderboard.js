import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

// GET /api/leaderboard?type=steals|deposits
router.get('/', async (req, res) => {
  const type = req.query.type === 'deposits' ? 'deposits' : 'steals'

  try {
    const viewName = type === 'steals' ? 'leaderboard_steals' : 'leaderboard_deposits'
    const orderCol = type === 'steals' ? 'total_steals' : 'total_deposited'

    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .order(orderCol, { ascending: false })
      .limit(10)

    if (error) throw error

    // Fetch total_hours for all users in one query
    const userIds = data.map(u => u.id)
    const { data: userHours = [] } = await supabase
      .from('users')
      .select('id, total_hours')
      .in('id', userIds)
    const hoursMap = Object.fromEntries(userHours.map(u => [u.id, u.total_hours]))

    // Enrich each entry with top 3 stolen items + total_hours
    const enriched = await Promise.all(
      data.map(async (user, i) => {
        const { data: items } = await supabase
          .from('steals')
          .select('item_name, tier, amount')
          .eq('user_id', user.id)

        const itemMap = {}
        items?.forEach(({ item_name, tier, amount }) => {
          if (!item_name) return
          if (!itemMap[item_name]) itemMap[item_name] = { name: item_name, count: 0, tier, amount: 0 }
          itemMap[item_name].count++
          if (Number(amount) > itemMap[item_name].amount) itemMap[item_name].amount = Number(amount)
        })

        const topSteals = Object.values(itemMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((item, j) => ({ ...item, rank: j + 1 }))

        return {
          rank:        i + 1,
          id:          user.id,
          name:        user.username,
          avatar_url:  user.avatar_url,
          discord_id:  user.discord_id,
          steals:      Number(user.total_steals),
          deposited:   `$${Number(user.total_deposited).toFixed(2)}`,
          total_hours: Number(hoursMap[user.id]) || 0,
          topSteals,
        }
      })
    )

    res.json(enriched)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

export default router
