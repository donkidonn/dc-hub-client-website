import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

// Routes Luarmor calls through QuotaGuard static IPs so Luarmor's IP whitelist passes
const agent = () => new HttpsProxyAgent(process.env.QUOTAGUARD_URL)

const luarmorBase = () => `https://api.luarmor.net/v3/projects/${process.env.LUARMOR_PROJECT_ID}/users`
const luarmorAuth = () => ({ Authorization: process.env.LUARMOR_API_KEY })

export async function luarmorPost(body) {
  const { data } = await axios.post(luarmorBase(), body, { headers: luarmorAuth(), httpsAgent: agent() })
  return data
}

export async function luarmorPatch(body) {
  const { data } = await axios.patch(luarmorBase(), body, { headers: luarmorAuth(), httpsAgent: agent() })
  return data
}

export async function luarmorGet() {
  const { data } = await axios.get(luarmorBase(), { headers: luarmorAuth(), httpsAgent: agent() })
  return data
}

export async function luarmorDelete(body) {
  const { data } = await axios.delete(luarmorBase(), { data: body, headers: luarmorAuth(), httpsAgent: agent() })
  return data
}
