'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { StaffCalendarView, staffViewModeAtom, staffCurrentDateAtom } from '@/components/staff/calendar/StaffCalendarView';
import { StaffAgendaStats } from './StaffAgendaStats';
import { StaffTodaysSchedule } from './StaffTodaysSchedule';
import { StaffBookingModal } from '../modals/StaffBookingModal';
import { StaffBookingWithRelations } from '@/lib/services/staffBookingService';
import { useStaffTodaysBookings, useStaffPermission } from '@/lib/hooks/useStaffBookings';
import { Calendar, List, Plus, Clock } from 'lucide-react';

export function StaffAgenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<StaffBookingWithRelations | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  
  // Read calendar state from atoms
  const [viewMode] = useAtom(staffViewModeAtom);
  const [currentDateStr] = useAtom(staffCurrentDateAtom);
  
  // Get today's bookings and permissions
  const { data: todaysBookings = [] } = useStaffTodaysBookings();
  const { data: canManageSchedule } = useStaffPermission('can_manage_own_schedule');
  const { data: canViewAll } = useStaffPermission('can_view_all_appointments');

  const handleBookingSelect = (booking: StaffBookingWithRelations) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  const handleBookingUpdated = () => {
    // Refresh data is handled by React Query invalidation
    setSelectedBooking(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
          Mijn Agenda
        </h1>
        <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
          {canViewAll 
            ? 'Bekijk en beheer alle afspraken in de salon' 
            : 'Bekijk en beheer je persoonlijke agenda en afspraken'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <StaffAgendaStats viewMode={viewMode} currentDate={new Date(currentDateStr)} />

      {/* Today's Schedule Sidebar - only on larger screens */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {/* View Toggle */}
          <div className="flex justify-center sm:justify-end mb-4">
            <div className="flex bg-gray-100 rounded-full p-1 w-full sm:w-auto max-w-xs">
              <button
                onClick={() => setView('calendar')}
                className={`flex-1 sm:flex-initial px-4 sm:px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center space-x-2 ${
                  view === 'calendar'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Kalender</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex-1 sm:flex-initial px-4 sm:px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center space-x-2 ${
                  view === 'list'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Lijst</span>
              </button>
            </div>
          </div>

          {/* Main Calendar/List View */}
          {view === 'calendar' ? (
            <StaffCalendarView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onBookingSelect={handleBookingSelect}
              showAddButton={canManageSchedule}
            />
          ) : (
            <div className="card">
              <h2 className="text-heading mb-4">Afspraken Lijst</h2>
              <div className="text-center text-gray-500 py-8">
                <List className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>Lijst weergave wordt binnenkort toegevoegd</p>
                <p className="text-sm">Gebruik de kalender weergave om je afspraken te bekijken</p>
              </div>
            </div>
          )}
        </div>

        {/* Today's Schedule Sidebar */}
        <div className="xl:col-span-1">
          <StaffTodaysSchedule 
            bookings={todaysBookings}
            onBookingSelect={handleBookingSelect}
            selectedBooking={selectedBooking}
          />
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      {canManageSchedule && (
        <div className="fixed bottom-6 right-6 xl:hidden">
          <button
            className="bg-[#02011F] text-white rounded-full p-4 shadow-lg hover:bg-gray-800 transition-colors"
            title="Nieuwe afspraak toevoegen"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Booking Modal */}
      <StaffBookingModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={handleCloseModal}
        onUpdated={handleBookingUpdated}
      />
    </div>
  );
}