'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type NavigationConfirmHandler = (navigationFn: () => void) => void

interface NavigationContextType {
  registerConfirmHandler: (handler: NavigationConfirmHandler | null) => void
  handleNavigation: (navigationFn: () => void) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [confirmHandler, setConfirmHandler] = useState<NavigationConfirmHandler | null>(null)

  const registerConfirmHandler = useCallback((handler: NavigationConfirmHandler | null) => {
    setConfirmHandler(() => handler)
  }, [])

  const handleNavigation = useCallback((navigationFn: () => void) => {
    if (confirmHandler) {
      confirmHandler(navigationFn)
    } else {
      navigationFn()
    }
  }, [confirmHandler])

  return (
    <NavigationContext.Provider value={{ registerConfirmHandler, handleNavigation }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

