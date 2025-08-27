import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, MapPin, Users, Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const CalendarView: React.FC = () => {
  const { bookings } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const events = [];

    // Check for booking start dates
    const startingBookings = bookings.filter(booking => 
      booking.travel_start_date === dateString
    );
    startingBookings.forEach(booking => {
      events.push({
        id: `start-${booking.booking_id}`,
        type: 'departure',
        title: `${booking.package_name} - Departure`,
        customer: booking.customer_name,
        booking,
        time: '09:00',
        priority: 'high'
      });
    });

    // Check for booking end dates
    const endingBookings = bookings.filter(booking => 
      booking.travel_end_date === dateString
    );
    endingBookings.forEach(booking => {
      events.push({
        id: `end-${booking.booking_id}`,
        type: 'return',
        title: `${booking.package_name} - Return`,
        customer: booking.customer_name,
        booking,
        time: '18:00',
        priority: 'medium'
      });
    });

    // Check for payment due dates (7 days before travel)
    const paymentDueBookings = bookings.filter(booking => {
      if (booking.balance_amount <= 0) return false;
      const travelDate = new Date(booking.travel_start_date);
      const dueDate = new Date(travelDate);
      dueDate.setDate(travelDate.getDate() - 7);
      return dueDate.toISOString().split('T')[0] === dateString;
    });
    paymentDueBookings.forEach(booking => {
      events.push({
        id: `payment-${booking.booking_id}`,
        type: 'payment',
        title: `Payment Due - ${booking.package_name}`,
        customer: booking.customer_name,
        booking,
        amount: booking.balance_amount,
        time: '10:00',
        priority: 'high'
      });
    });

    return events;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'departure':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'return':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'departure':
        return MapPin;
      case 'return':
        return Calendar;
      case 'payment':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWithin48Hours = (date: Date) => {
    const now = new Date();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    return Math.abs(date.getTime() - now.getTime()) <= fortyEightHours;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isCurrentDay = isToday(date);
      const isHighlighted = isWithin48Hours(date);

      days.push(
        <div
          key={day}
          className={`h-32 border border-gray-200 p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
            isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
          } ${isHighlighted ? 'ring-2 ring-yellow-300' : ''}`}
          onClick={() => {
            setSelectedDate(date);
            if (events.length > 0) {
              setIsEventModalOpen(true);
            }
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold ${
              isCurrentDay ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {day}
            </span>
            {events.length > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {events.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            {events.slice(0, 2).map((event) => {
              const Icon = getEventIcon(event.type);
              return (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded border ${getEventColor(event.type)} truncate`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              );
            })}
            {events.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{events.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Track travel schedules and important reminders</p>
        </div>
        <Button icon={Plus}>
          Add Event
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() => navigateMonth('prev')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                onClick={() => navigateMonth('next')}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Event Types</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Departure</p>
                <p className="text-sm text-gray-600">Travel start dates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Return</p>
                <p className="text-sm text-gray-600">Travel end dates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Payment Due</p>
                <p className="text-sm text-gray-600">Payment reminders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={`Events for ${selectedDate?.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`}
        size="lg"
      >
        <div className="space-y-4">
          {selectedDateEvents.map((event) => {
            const Icon = getEventIcon(event.type);
            return (
              <div key={event.id} className={`p-4 rounded-lg border ${getEventColor(event.type)}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{event.customer}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      {event.amount && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Amount: ₹{event.amount.toLocaleString()}</span>
                        </div>
                      )}
                      {event.booking && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">
                            Booking ID: {event.booking.booking_id} | 
                            Passengers: {event.booking.pax_count} | 
                            Status: {event.booking.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={event.priority === 'high' ? 'danger' : 'info'} size="sm">
                    {event.priority}
                  </Badge>
                </div>
              </div>
            );
          })}
          
          {selectedDateEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No events scheduled for this date</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarView;