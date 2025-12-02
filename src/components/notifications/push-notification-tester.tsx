'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Bell, AlertCircle } from 'lucide-react'
import {
  subscribeToPushNotifications,
  isPushNotificationSubscribed,
  isPushNotificationSupported,
  getNotificationPermissionState,
  registerServiceWorker,
} from '@/lib/push-notifications'
import { useProfile } from '@/lib/react-query/hooks'

interface LogEntry {
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

export function PushNotificationTester() {
  const { data: profileData } = useProfile()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false)
  const [vapidConfigured, setVapidConfigured] = useState(false)
  const [title, setTitle] = useState('Notificación de Prueba')
  const [body, setBody] = useState('Esta es una notificación de prueba desde Vibo')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  function addLog(type: LogEntry['type'], message: string) {
    setLogs((prev) => [
      { timestamp: new Date(), type, message },
      ...prev.slice(0, 49), // Keep last 50 logs
    ])
  }

  async function checkStatus() {
    setLoading(true)
    addLog('info', 'Verificando estado de push notifications...')

    // Check browser support
    const supported = isPushNotificationSupported()
    setIsSupported(supported)
    addLog(supported ? 'success' : 'error', `Soporte del navegador: ${supported ? 'Sí' : 'No'}`)

    // Check permission state
    const permission = getNotificationPermissionState()
    setPermissionState(permission)
    addLog('info', `Estado del permiso: ${permission}`)

    // Check VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const hasVapidKey = !!vapidKey && vapidKey.length > 0
    setVapidConfigured(hasVapidKey)
    addLog(hasVapidKey ? 'success' : 'warning', `VAPID key configurada: ${hasVapidKey ? 'Sí' : 'No'}`)

    // Check service worker
    if (supported) {
      try {
        const registration = await registerServiceWorker()
        setServiceWorkerRegistered(!!registration)
        addLog(registration ? 'success' : 'error', `Service Worker registrado: ${registration ? 'Sí' : 'No'}`)

        // Check subscription
        const subscribed = await isPushNotificationSubscribed()
        setIsSubscribed(subscribed)
        addLog(subscribed ? 'success' : 'info', `Suscripción activa: ${subscribed ? 'Sí' : 'No'}`)
      } catch (error) {
        addLog('error', `Error verificando service worker: ${error}`)
      }
    }

    setLoading(false)
  }

  async function handleSubscribe() {
    addLog('info', 'Intentando suscribirse a push notifications...')
    const success = await subscribeToPushNotifications()
    if (success) {
      setIsSubscribed(true)
      setPermissionState('granted')
      addLog('success', 'Suscripción exitosa')
      await checkStatus()
    } else {
      addLog('error', 'Error al suscribirse')
    }
  }

  async function handleSendTest() {
    if (!profileData?.user) {
      addLog('error', 'Usuario no autenticado')
      setResult({ success: false, message: 'Usuario no autenticado' })
      return
    }

    if (!isSubscribed) {
      addLog('warning', 'No estás suscrito a push notifications. Suscribiéndote...')
      const subscribed = await subscribeToPushNotifications()
      if (!subscribed) {
        addLog('error', 'No se pudo suscribir. Por favor, habilita las notificaciones primero.')
        setResult({ success: false, message: 'No se pudo suscribir a las notificaciones' })
        return
      }
      setIsSubscribed(true)
    }

    setSending(true)
    setResult(null)
    addLog('info', `Enviando notificación de prueba: "${title}"`)

    try {
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profileData.user.id,
          title,
          body,
          url: '/',
          data: { test: true },
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addLog('success', `Notificación enviada exitosamente. Enviadas: ${data.sent}/${data.total}`)
        setResult({
          success: true,
          message: `Notificación enviada exitosamente (${data.sent}/${data.total} dispositivos)`,
        })
      } else {
        addLog('error', `Error al enviar: ${data.error || 'Error desconocido'}`)
        setResult({
          success: false,
          message: data.error || 'Error al enviar la notificación',
        })
      }
    } catch (error: any) {
      addLog('error', `Error de red: ${error.message}`)
      setResult({
        success: false,
        message: `Error de red: ${error.message}`,
      })
    } finally {
      setSending(false)
    }
  }

  const StatusItem = ({ label, value, isOk }: { label: string; value: string | boolean; isOk: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
        {isOk ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de Push Notifications
          </CardTitle>
          <CardDescription>Información sobre la configuración actual</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <StatusItem label="Soporte del navegador" value={isSupported} isOk={isSupported} />
              <StatusItem
                label="Permiso de notificaciones"
                value={permissionState === 'granted' ? 'Concedido' : permissionState === 'denied' ? 'Denegado' : 'Pendiente'}
                isOk={permissionState === 'granted'}
              />
              <StatusItem label="Suscripción activa" value={isSubscribed} isOk={isSubscribed} />
              <StatusItem label="Service Worker registrado" value={serviceWorkerRegistered} isOk={serviceWorkerRegistered} />
              <StatusItem label="VAPID keys configuradas" value={vapidConfigured} isOk={vapidConfigured} />
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
              Actualizar Estado
            </Button>
            {!isSubscribed && permissionState !== 'denied' && (
              <Button variant="secondary" size="sm" onClick={handleSubscribe}>
                Suscribirse
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Notificación de Prueba</CardTitle>
          <CardDescription>Envía una notificación push a tu dispositivo actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert variant={result.success ? undefined : 'destructive'}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {permissionState === 'denied' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="test-title">Título</Label>
            <Input
              id="test-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-body">Cuerpo</Label>
            <Input
              id="test-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Cuerpo de la notificación"
            />
          </div>

          <Button onClick={handleSendTest} disabled={sending || !isSubscribed || permissionState === 'denied'} className="w-full">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Enviar Notificación de Prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Eventos y mensajes del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay logs aún</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded border-l-2 ${
                    log.type === 'success'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : log.type === 'error'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : log.type === 'warning'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              className="w-full mt-4"
            >
              Limpiar Logs
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

