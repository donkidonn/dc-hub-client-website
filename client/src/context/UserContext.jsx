import { createContext, useContext, useEffect, useState } from 'react'

export const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  function fetchUser() {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUser() }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
