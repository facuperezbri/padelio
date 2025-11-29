'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Camera, Loader2, X } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  userName: string
  onUploadComplete: (newUrl: string | null) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, userName, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná una imagen')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const newUrl = await uploadAvatar(userId, file)
    
    if (newUrl) {
      // Update profile in database
      await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', userId)
      
      onUploadComplete(newUrl)
    }
    
    setUploading(false)
    setPreviewUrl(null)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true)
    
    // Update profile to remove avatar
    await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)
    
    onUploadComplete(null)
    setUploading(false)
    setPreviewUrl(null)
  }

  return (
    <div className="relative">
      <PlayerAvatar
        name={userName}
        avatarUrl={previewUrl || currentAvatarUrl}
        size="xl"
        className="ring-4 ring-background"
      />
      
      {/* Upload overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Remove button (if has avatar) */}
      {currentAvatarUrl && !uploading && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-1 -top-1 h-6 w-6 rounded-full"
          onClick={handleRemoveAvatar}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

