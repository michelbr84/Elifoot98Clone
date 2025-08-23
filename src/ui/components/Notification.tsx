'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
  onClose?: () => void
}

export function Notification({ type, message, duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600'
  }[type]

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }[type]

  if (!isMounted) return null

  return createPortal(
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 max-w-md`}>
        <span className="text-2xl">{icon}</span>
        <p className="font-mono">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="ml-4 hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  )
}

// Notification Manager for global notifications
class NotificationManager {
  private static listeners: Array<(notification: NotificationProps) => void> = []

  static subscribe(listener: (notification: NotificationProps) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  static show(notification: Omit<NotificationProps, 'onClose'>) {
    this.listeners.forEach(listener => listener(notification as NotificationProps))
  }

  static success(message: string, duration?: number) {
    this.show({ type: 'success', message, duration })
  }

  static error(message: string, duration?: number) {
    this.show({ type: 'error', message, duration })
  }

  static info(message: string, duration?: number) {
    this.show({ type: 'info', message, duration })
  }

  static warning(message: string, duration?: number) {
    this.show({ type: 'warning', message, duration })
  }
}

export { NotificationManager }