import React from 'react';
import { Calendar, Clock, AlertCircle, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Badge from '../ui/Badge';

const ReminderCalendar: React.FC = () => {
  const { bookings } = useApp();
  const navigate = useNavigate();
  
  // Get events within next 48 hours
  const now = new Date();
  const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const upcomingEvents = bookings
    .filter(booking => {
      const travelStart = new Date(booking.travel_start_date);
      const travelEnd = new Date(booking.travel_end_date);
      return (travelStart >= now && travelStart <= fortyEightHoursLater) ||
             (travelEnd >= now && travelEnd <= fortyEightHoursLater) ||
             (booking.balance_amount > 0 && booking.status === 'confirmed');
    })
    .map(booking => {
      const travelStart = new Date(booking.travel_start_date);
      const travelEnd = new Date(booking.travel_end_date);
      const events = [];
      
      if (travelStart >= now && travelStart <= fortyEightHoursLater) {
        events.push({
          id: `${booking.booking_id}-start`,
          type: 'booking_start' as const,
          title: `${booking.package_name} - Departure`,
          date: booking.travel_start_date,
          customer: booking.customer_name,
          booking: booking,
          priority: 'high'
        });
      }
      
      if (travelEnd >= now && travelEnd <= fortyEightHoursLater) {
        events.push({
          id: `${booking.booking_id}-end`,
          type: 'booking_end' as const,
          title: `${booking.package_name} - Return`,
          date: booking.travel_end_date,
          customer: booking.customer_name,
          booking: booking,
          priority: 'medium'
        });
      }
      
      if (booking.balance_amount > 0 && booking.status === 'confirmed') {
        events.push({
          id: `${booking.booking_id}-payment`,
          type: 'payment_due' as const,
          title: `Payment Due - ${booking.package_name}`,
          date: booking.travel_start_date,
          amount: booking.balance_amount,
          customer: booking.customer_name,
          booking: booking,
          priority: 'high'
        });
      }
      
      return events;
    })
    .flat()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'booking_start':
        return MapPin;
      case 'booking_end':
        return Calendar;
      case 'payment_due':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getEventColors = (type: string, priority: string) => {
    switch (type) {
      case 'booking_start':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'bg-green-100 text-green-600',
          badge: 'success'
        };
      case 'booking_end':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          badge: 'info'
        };
      case 'payment_due':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'bg-red-100 text-red-600',
          badge: 'danger'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'bg-gray-100 text-gray-600',
          badge: 'default'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500">No upcoming events in the next 48 hours</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingEvents.map((event) => {
        const Icon = getEventIcon(event.type);
        const colors = getEventColors(event.type, event.priority);
        
        return (
          <div 
            key={event.id} 
            className={`${colors.bg} border p-4 hover:shadow-md transition-all duration-200 cursor-pointer`}
            onClick={() => navigate('/bookings')}
          >
            <div className="flex items-start space-x-4">
              <div className={`${colors.icon} p-3 flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {event.title}
                  </h4>
                  <Badge variant={colors.badge as any} size="sm">
                    {formatDate(event.date)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{event.customer}</span>
                    </div>
                    {event.booking && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">•</span>
                        <span>{event.booking.pax_count} pax</span>
                      </div>
                    )}
                  </div>
                  
                  {event.amount && (
                    <div className="text-right">
                      <span className="font-semibold text-red-600">
                        ₹{event.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 block">due</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {upcomingEvents.length > 5 && (
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/bookings')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all upcoming events →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReminderCalendar;
