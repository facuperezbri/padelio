'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Check } from 'lucide-react'

const EditModeContext = createContext<{
  editMode: boolean
  setEditMode: (value: boolean) => void
} | null>(null)

export function useEditMode() {
  const context = useContext(EditModeContext)
  if (!context) {
    throw new Error('useEditMode must be used within ProfileEditModeProvider')
  }
  return context
}

export function ProfileEditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false)
  return (
    <EditModeContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function ProfileEditButtonWrapper() {
  const { editMode, setEditMode } = useEditMode()
  return (
    <Button variant="ghost" size="icon" onClick={() => setEditMode(!editMode)}>
      {editMode ? <Check className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
    </Button>
  )
}

