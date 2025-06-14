import SignUpForm from '@/components/auth/SignUpForm'
import AuthPageLayout from '@/components/auth/AuthPageLayout'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <AuthPageLayout
      title="Account aanmaken"
      subtitle="Start gratis proefperiode"
      footer={
        <>
          Al een account?{' '}
          <Link href="/auth/sign-in" className="text-[#02011F] hover:opacity-90 font-medium transition-opacity">
            Inloggen
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthPageLayout>
  )
} 