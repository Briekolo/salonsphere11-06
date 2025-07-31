import { CheckCircle2, Sparkles } from 'lucide-react'
import React from 'react'
import { LogoStatic } from '@/components/layout/LogoStatic'

interface AuthPageLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  footer?: React.ReactNode
}

const features = [
  'Alles-in-één salonbeheer (CRM, voorraad, betalingen)',
  'Realtime voorraad & afsprakenoverzicht',
  'Automatische e-mails en herinneringen',
  'Geen creditcard nodig – start gratis',
]

export default function AuthPageLayout({ children, title, subtitle, footer }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 relative">
      {/* Left – form */}
      <div className="flex items-center justify-center p-4 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <LogoStatic size="md" className="justify-center" />
          </div>

          {/* Form Card */}
          <div className="card space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
            </div>

            {children}

            {footer && (
              <div className="text-center text-sm text-muted pt-4 border-t border-gray-100">
                {footer}
              </div>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted mb-2">Vertrouwd door 500+ salons</p>
            <div className="flex justify-center space-x-4 opacity-60">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider Line - only visible on desktop */}
      <div className="hidden lg:block absolute left-1/2 top-[5%] h-[90%] w-px bg-sidebar-border transform -translate-x-1/2"></div>

      {/* Right – marketing panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-white text-gray-900">
        <div className="max-w-lg">
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mb-6">
              ✨ Nieuw: AI-gestuurde voorraadvoorspelling
            </span>
            <h2 className="text-4xl font-bold mb-6 leading-tight text-gray-900">
              Jouw salon,{' '}
              <span className="text-gray-600 block">volledig geautomatiseerd</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Van boekingen tot betalingen, van voorraad tot marketing – 
              alles in één krachtige, intuïtieve platform.
            </p>
          </div>

          <ul className="space-y-4 text-base mb-12">
            {features.map((feature, index) => (
              <li key={feature} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-[#02011F]" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">500+</span> tevreden salonhouders
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">4.9/5 gemiddelde beoordeling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 