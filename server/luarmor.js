import axios from 'axios'

// Proxy config — routes Luarmor calls through a static IP so Luarmor's IP whitelist passes
const proxy = {
  host:     process.env.PROXY_HOST,
  port:     Number(process.env.PROXY_PORT),
  auth: {
    username: process.env.PROXY_USER,
    password: process.env.PROXY_PASS,
  },
}

const luarmorBase  = () => `https://api.luarmor.net/v3/projects/${process.env.LUARMOR_PROJECT_ID}/users`
const luarmorAuth  = () => ({ Authorization: process.env.LUARMOR_API_KEY })

export async function luarmorPost(body) {
  const { data } = await axios.post(luarmorBase(), body, { headers: luarmorAuth(), proxy })
  return data
}

export async function luarmorPatch(body) {
  const { data } = await axios.patch(luarmorBase(), body, { headers: luarmorAuth(), proxy })
  return data
}

export async function luarmorGet() {
  const { data } = await axios.get(luarmorBase(), { headers: luarmorAuth(), proxy })
  return data
}

export async function luarmorDelete(body) {
  const { data } = await axios.delete(luarmorBase(), { data: body, headers: luarmorAuth(), proxy })
  return data
}
