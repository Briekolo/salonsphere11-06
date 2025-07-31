'use client';

import React, { useState } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  iconClassName?: string
  textClassName?: string
  customLogoUrl?: string | null
  salonName?: string
}

export function LogoDynamic({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  iconClassName = '',
  textClassName = '',
  customLogoUrl = null,
  salonName = 'SalonSphere'
}: LogoProps) {
  const [imageError, setImageError] = useState(false)
  // Sizes configuration
  const sizes = {
    sm: {
      width: 80,
      height: 32,
      text: 'text-base',
      gap: 'gap-2'
    },
    md: {
      width: 120,
      height: 48,
      text: 'text-2xl',
      gap: 'gap-3'
    },
    lg: {
      width: 160,
      height: 64,
      text: 'text-3xl',
      gap: 'gap-4'
    }
  }

  const sizeConfig = sizes[size]

  // Full Logo Component - using custom salon logo or SalonSphere fallback
  const FullLogo = () => {
    // Show custom salon logo if available and no error
    if (customLogoUrl && !imageError) {
      return (
        <div className="overflow-hidden rounded-lg">
          <Image 
            src={customLogoUrl}
            alt={salonName}
            width={sizeConfig.width}
            height={sizeConfig.height}
            sizes="(max-width: 768px) 80px, 120px"
            style={{ height: 'auto', objectFit: 'contain', borderRadius: '8px' }}
            priority
            onError={() => setImageError(true)}
          />
        </div>
      )
    }
    
    // Fallback to SalonSphere logo
    return (
      <div className="overflow-hidden rounded-lg">
        <Image 
          src="/brand/salon-logo.png" 
          alt="SalonSphere" 
          width={sizeConfig.width}
          height={sizeConfig.height}
          sizes="(max-width: 768px) 80px, 120px"
          style={{ height: 'auto', borderRadius: '8px' }}
          priority
        />
      </div>
    )
  }

  // Text Only Component (fallback)
  const LogoText = () => (
    <span className={`
      ${sizeConfig.text} 
      font-bold 
      text-[#2563eb]
      ${textClassName}
    `}>
      {customLogoUrl && !imageError ? salonName : 'SalonSphere'}
    </span>
  )

  // Icon Only - using custom logo or fallback icon
  const LogoIcon = () => {
    if (customLogoUrl && !imageError) {
      return (
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 overflow-hidden rounded-lg ${iconClassName}`}>
          <Image 
            src={customLogoUrl}
            alt={salonName}
            width={48}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            onError={() => setImageError(true)}
          />
        </div>
      )
    }
    
    // Fallback icon
    return (
      <div className={`
        w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12
        bg-[#E3ECFB] 
        rounded-lg
        flex items-center justify-center
        ${iconClassName}
      `}>
        <Sparkles className="h-5 w-5 text-[#7091D9]" />
      </div>
    )
  }

  // Render based on variant
  if (variant === 'icon') {
    return (
      <div className={className}>
        <LogoIcon />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={className}>
        <LogoText />
      </div>
    )
  }

  // Full variant (default) - use the complete logo
  return (
    <div className={className}>
      <FullLogo />
    </div>
  )
} 