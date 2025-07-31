import { StaffAppointmentDetail } from '@/components/staff/appointments/StaffAppointmentDetail';

export default function StaffAppointmentDetailPage({ params }: { params: { id: string } }) {
  return <StaffAppointmentDetail appointmentId={params.id} />;
}

export const metadata = {
  title: 'Afspraak Details - SalonSphere',
  description: 'View appointment details',
};