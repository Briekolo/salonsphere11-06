'use client'

import { useId } from 'react'
import { NotificationPopup } from './NotificationPopup'

interface NotificationWrapperProps {
  instanceType?: 'desktop' | 'mobile'
}

export function NotificationWrapper({ instanceType = 'desktop' }: NotificationWrapperProps) {
  const instanceId = useId()
  
  // Pass unique instance ID to prevent subscription conflicts
  return <NotificationPopup instanceId={instanceId} instanceType={instanceType} />
}