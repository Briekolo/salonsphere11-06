import { redirect } from 'next/navigation';

export default function StaffRoot() {
  // Redirect to dashboard
  redirect('/staff/dashboard');
}