'use client'

import { useEffect, useState } from 'react'
import { Notification, NotificationProps, NotificationManager } from './Notification'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: number }>>([])
  const [nextId, setNextId] = useState(0)

  useEffect(() => {
    const unsubscribe = NotificationManager.subscribe((notification) => {
      const id = nextId
      setNextId(prev => prev + 1)
      setNotifications(prev => [...prev, { ...notification, id }])
    })

    return unsubscribe
  }, [nextId])

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  )
}