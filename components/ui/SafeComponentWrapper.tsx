'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
  errorName?: string
}

interface State {
  hasError: boolean
}

export class SafeComponentWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn(`${this.props.errorName || 'Component'} failed, using fallback:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}