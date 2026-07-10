import { useEffect } from 'react'
import { useAuth } from './useAuth'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>
  }
}

/**
 * Relie l'utilisateur connecté (admin ou client) à OneSignal : login(userId) +
 * tag "role" pour pouvoir cibler les notifications côté serveur.
 */
export function usePushIdentity() {
  const user = useAuth((s) => s.user)

  useEffect(() => {
    if (!user) return
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.login(user.id)
      OneSignal.User.addTag('role', user.role === 'ADMIN' ? 'admin' : 'customer')

      // Le SDK ne propose pas de popup automatique par défaut — on la déclenche
      // nous-mêmes, juste après une action utilisateur (connexion).
      if (OneSignal.Notifications.permission !== true) {
        await OneSignal.Notifications.requestPermission()
      }
    })
  }, [user])
}
