import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StaffLayout } from '@/components/staff/StaffLayout';

export default async function StaffLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/sign-in');
    }

    // Get user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, role, tenant_id, first_name, last_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      redirect('/auth/sign-in');
    }

    // Check if user is staff
    if (userData.role !== 'staff') {
      // Redirect based on role
      if (userData.role === 'admin' || userData.role === 'owner') {
        redirect('/admin');
      } else {
        redirect('/');
      }
    }

    return (
      <StaffLayout user={userData}>
        {children}
      </StaffLayout>
    );
  } catch (error) {
    console.error('Error in staff layout:', error);
    redirect('/auth/sign-in');
  }
}