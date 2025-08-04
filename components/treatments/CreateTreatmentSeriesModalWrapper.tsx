'use client'

import { Suspense } from 'react'
import CreateTreatmentSeriesModal from './CreateTreatmentSeriesModal'

interface CreateTreatmentSeriesModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedClientId?: string
  preselectedServiceId?: string
  useTemplate?: boolean
  preselectedTemplateId?: string
}

export function CreateTreatmentSeriesModalWrapper(props: CreateTreatmentSeriesModalWrapperProps) {
  return <CreateTreatmentSeriesModal {...props} />
}