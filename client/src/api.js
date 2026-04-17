const BASE_URL = import.meta.env.VITE_API_URL || ''

const getToken = () => localStorage.getItem('token')

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
})

async function request(url, options = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${url}`, { ...options, headers: headers() })
  } catch {
    throw new Error('Connection error. Please try again.')
  }

  // Rate limit
  if (res.status === 429) throw new Error('Too many requests. Please wait a moment.')

  // Parse body — might not be JSON (e.g. proxy errors, plain-text rate limit messages)
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(res.ok ? 'Unexpected server response.' : 'Something went wrong. Please try again.')
  }

  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

const api = {
  get:  (url)        => request(url),
  post: (url, body)  => request(url, { method: 'POST', body: JSON.stringify(body) }),
}

export default api
