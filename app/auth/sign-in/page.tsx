import SignInForm from '@/components/auth/SignInForm'
import AuthPageLayout from '@/components/auth/AuthPageLayout'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <AuthPageLayout
      title="Inloggen"
      subtitle="Welkom terug bij SalonSphere"
      footer={
        <>
          Geen account?{' '}
          <Link href="/auth/sign-up" className="text-[#02011F] hover:opacity-90 font-medium transition-opacity">
            Account aanmaken
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthPageLayout>
  )
} 