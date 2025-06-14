import React from 'react'
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  iconClassName = '',
  textClassName = ''
}: LogoProps) {
  // Sizes configuration
  const sizes = {
    sm: {
      width: 120,
      height: 19,
      text: 'text-base',
      gap: 'gap-2'
    },
    md: {
      width: 180,
      height: 28,
      text: 'text-2xl',
      gap: 'gap-3'
    },
    lg: {
      width: 240,
      height: 37,
      text: 'text-3xl',
      gap: 'gap-4'
    }
  }

  const sizeConfig = sizes[size]

  // Full Logo Component - using the actual SalonSphere logo
  const FullLogo = () => (
    <Image 
      src="/brand/salon-logo.png" 
      alt="SalonSphere" 
      width={sizeConfig.width}
      height={sizeConfig.height}
      sizes="(max-width: 768px) 120px, 180px"
      style={{ height: 'auto' }}
      priority
    />
  )

  // Text Only Component (fallback)
  const LogoText = () => (
    <span className={`
      ${sizeConfig.text} 
      font-bold 
      text-[#2563eb]
      ${textClassName}
    `}>
      SalonSphere
    </span>
  )

  // Icon Only - using a smaller version or just the "S"
  const LogoIcon = () => (
    <div className={`
      w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12
      bg-[#2563eb] 
      rounded-xl 
      flex items-center justify-center
      ${iconClassName}
    `}>
      <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">
        S
      </span>
    </div>
  )

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