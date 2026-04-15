import { createContext, useState, useCallback } from 'react'

export const AnimationContext = createContext({
  animationsEnabled: true,
  toggleAnimations: () => {},
})

export function AnimationProvider({ children }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('gn_animations')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => {
      const next = !prev
      try { localStorage.setItem('gn_animations', String(next)) } catch {}
      return next
    })
  }, [])

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {children}
    </AnimationContext.Provider>
  )
}
