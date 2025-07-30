export type BookingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: 'Gepland',
  confirmed: 'Bevestigd',
  completed: 'Voltooid',
  cancelled: 'Geannuleerd',
  no_show: 'Niet verschenen'
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; icon: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-600' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' },
  no_show: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-600' }
};

export function getBookingStatus(booking: { scheduled_at: string; status?: string | null }): BookingStatus {
  // If status is explicitly set, use it
  if (booking.status && ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(booking.status)) {
    return booking.status as BookingStatus;
  }
  
  // Otherwise, determine based on time
  const appointmentTime = new Date(booking.scheduled_at);
  const now = new Date();
  
  if (appointmentTime < now) {
    return 'completed';
  }
  
  return 'scheduled';
}