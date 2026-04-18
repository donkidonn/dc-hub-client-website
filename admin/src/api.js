const BASE = import.meta.env.VITE_API_URL || ''

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

async function request(url, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${url}`, { ...options, headers: headers() })
  } catch {
    throw new Error('Connection error.')
  }
  let data
  try { data = await res.json() } catch { throw new Error('Unexpected response.') }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

const api = {
  get:  (url)       => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
}

export default api
