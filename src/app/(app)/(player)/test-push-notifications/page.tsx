'use client'

import { Header } from '@/components/layout/header'
import { PushNotificationTester } from '@/components/notifications/push-notification-tester'
import { useProfile } from '@/lib/react-query/hooks'
import { PadelBallLoader } from '@/components/ui/padel-ball-loader'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestPushNotificationsPage() {
  const { data: profileData, isLoading } = useProfile()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !profileData) {
      router.push('/login')
    }
  }, [isLoading, profileData, router])

  if (isLoading || !profileData) {
    return (
      <>
        <Header title="Test Push Notifications" showBack />
        <div className="flex h-[60vh] items-center justify-center">
          <PadelBallLoader size="lg" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Test Push Notifications" showBack />
      <div className="p-4 pb-24">
        <PushNotificationTester />
      </div>
    </>
  )
}

