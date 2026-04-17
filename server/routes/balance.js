import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth.js'
import supabase from '../db.js'

const router = Router()

// POST /api/balance/deposit — create a Nowpayments payment (in-app, no redirect)
router.post('/deposit', requireAuth, async (req, res) => {
  const { amount, currency = 'usdtbsc' } = req.body
  if (!amount || Number(amount) < 1) {
    return res.status(400).json({ error: 'Minimum deposit is $1' })
  }

  try {
    const { data: payment } = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: Number(amount),
        price_currency: 'usd',
        pay_currency: currency,
        ipn_callback_url: `${process.env.SERVER_URL}/api/balance/webhook`,
        order_description: 'Grand Notifier balance deposit',
      },
      { headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY } }
    )

    // Block if user already has a pending payment
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('deposits')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .gt('created_at', thirtyMinsAgo)
      .maybeSingle()
    if (existing) return res.status(400).json({ error: 'You already have a pending payment. Complete or wait for it to expire first.' })

    // Save deposit using Nowpayments payment_id
    const { error } = await supabase.from('deposits').insert({
      user_id: req.user.id,
      amount: Number(amount),
      crypto: currency,
      payment_id: String(payment.payment_id),
      status: 'pending',
    })

    if (error) throw error

    res.json({
      payment_id:  String(payment.payment_id),
      pay_address: payment.pay_address,
      pay_amount:  payment.pay_amount,
      pay_currency: payment.pay_currency,
      expiry:      payment.expiration_estimate_date,
    })
  } catch (err) {
    console.error('Deposit error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// GET /api/balance/deposit/pending — resume an existing pending payment if one exists
router.get('/deposit/pending', requireAuth, async (req, res) => {
  // Only look within the last 30 minutes (NowPayments default expiry window)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: deposit } = await supabase
    .from('deposits')
    .select('id, amount, payment_id')
    .eq('user_id', req.user.id)
    .eq('status', 'pending')
    .gt('created_at', thirtyMinsAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!deposit) return res.json(null)

  try {
    const { data: payment } = await axios.get(
      `https://api.nowpayments.io/v1/payment/${deposit.payment_id}`,
      { headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY } }
    )

    const resumable = ['waiting', 'confirming', 'confirmed'].includes(payment.payment_status)
    if (!resumable) {
      // Sync the terminal status back to DB so it stops showing as pending
      await supabase
        .from('deposits')
        .update({ status: payment.payment_status })
        .eq('id', deposit.id)
      return res.json(null)
    }

    res.json({
      payment_id:   deposit.payment_id,
      pay_address:  payment.pay_address,
      pay_amount:   payment.pay_amount,
      pay_currency: payment.pay_currency,
      expiry:       payment.expiration_estimate_date,
      amount:       deposit.amount,
      status:       payment.payment_status,
    })
  } catch (err) {
    console.error('Pending payment fetch error:', err.response?.data || err.message)
    res.json(null) // silently fail — just show the form
  }
})

// POST /api/balance/deposit/cancel — cancel the user's current pending payment
router.post('/deposit/cancel', requireAuth, async (req, res) => {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: deposit, error } = await supabase
    .from('deposits')
    .update({ status: 'cancelled' })
    .eq('user_id', req.user.id)
    .eq('status', 'pending')
    .gt('created_at', thirtyMinsAgo)
    .select('id')
    .maybeSingle()

  if (error) return res.status(500).json({ error: 'Failed to cancel payment' })
  if (!deposit) return res.status(404).json({ error: 'No pending payment found' })

  res.json({ ok: true })
})

// GET /api/balance/deposit/:paymentId/status — poll payment status and sync to DB
router.get('/deposit/:paymentId/status', requireAuth, async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.nowpayments.io/v1/payment/${req.params.paymentId}`,
      { headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY } }
    )
    const status = data.payment_status

    // Sync terminal statuses back to the DB so records don't stay "pending" forever
    const TERMINAL = ['finished', 'confirmed', 'expired', 'failed', 'refunded', 'partially_paid']
    if (TERMINAL.includes(status)) {
      // Fetch the deposit row (must belong to this user to avoid spoofing)
      const { data: deposit } = await supabase
        .from('deposits')
        .select('id, status, amount, user_id')
        .eq('payment_id', req.params.paymentId)
        .eq('user_id', req.user.id)
        .maybeSingle()

      if (deposit && deposit.status === 'pending') {
        const dbStatus = status === 'finished' ? 'confirmed' : status
        await supabase.from('deposits').update({ status: dbStatus }).eq('id', deposit.id)

        // Credit balance on first confirmation (same logic as webhook)
        if (status === 'finished' || status === 'confirmed') {
          const { data: user } = await supabase
            .from('users').select('balance').eq('id', deposit.user_id).single()
          await supabase
            .from('users')
            .update({ balance: Number(user.balance) + Number(deposit.amount) })
            .eq('id', deposit.user_id)
        }
      }
    }

    res.json({ status })
  } catch (err) {
    console.error('Status poll error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

// POST /api/balance/webhook — Nowpayments IPN (no auth — verified by HMAC)
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-nowpayments-sig']
  if (!signature) return res.status(401).json({ error: 'Missing signature' })

  // Verify HMAC-SHA512 signature
  const sortedBody = JSON.stringify(
    Object.fromEntries(
      Object.keys(req.body).sort().map((k) => [k, req.body[k]])
    )
  )
  const hmac = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
    .update(sortedBody)
    .digest('hex')

  if (hmac !== signature) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { payment_id, payment_status } = req.body

  try {
    // Handle expired / failed — just mark and return
    if (payment_status === 'expired' || payment_status === 'failed' || payment_status === 'refunded') {
      await supabase
        .from('deposits')
        .update({ status: payment_status })
        .eq('payment_id', String(payment_id))
        .eq('status', 'pending')
      return res.sendStatus(200)
    }

    if (payment_status !== 'finished') return res.sendStatus(200)

    const { data: deposit } = await supabase
      .from('deposits')
      .select('*')
      .eq('payment_id', String(payment_id))
      .eq('status', 'pending')
      .single()

    if (!deposit) return res.sendStatus(200)

    await supabase.from('deposits').update({ status: 'confirmed' }).eq('id', deposit.id)

    const { data: user } = await supabase
      .from('users').select('balance').eq('id', deposit.user_id).single()

    await supabase
      .from('users')
      .update({ balance: Number(user.balance) + Number(deposit.amount) })
      .eq('id', deposit.user_id)

    res.sendStatus(200)
  } catch (err) {
    console.error('Webhook error:', err.message)
    res.sendStatus(500)
  }
})

export default router
