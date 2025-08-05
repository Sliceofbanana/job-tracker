"use client";

import { useState, useEffect } from 'react';
import { JobEntry, CalendarEvent } from '../types';
import { getGoogleCalendar } from '../utils/googleCalendar';

interface CalendarViewProps {
  jobs: JobEntry[];
  onDateClick?: (date: Date) => void;
  className?: string;
}

export default function CalendarView({ jobs, onDateClick, className = "" }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  // Check Google Calendar connection status
  useEffect(() => {
    const calendar = getGoogleCalendar();
    setIsGoogleCalendarConnected(calendar.isUserSignedIn());
  }, []);

  // Generate calendar events from jobs
  const events: CalendarEvent[] = jobs.flatMap(job => {
    const eventList: CalendarEvent[] = [];
    
    if (job.applicationDate) {
      eventList.push({
        id: `${job.id}-applied`,
        title: `Applied: ${job.company}`,
        date: new Date(job.applicationDate),
        type: 'application',
        jobId: job.id,
        color: 'blue'
      });
    }
    
    if (job.interviewDate) {
      eventList.push({
        id: `${job.id}-interview`,
        title: `Interview: ${job.company}`,
        date: new Date(job.interviewDate),
        type: 'interview',
        jobId: job.id,
        color: 'yellow'
      });
    }
    
    if (job.followUpDate) {
      eventList.push({
        id: `${job.id}-followup`,
        title: `Follow-up: ${job.company}`,
        date: new Date(job.followUpDate),
        type: 'followup',
        jobId: job.id,
        color: 'purple'
      });
    }
    
    return eventList;
  });

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const weeks = [];
  const currentWeek = new Date(startDate);
  
  while (currentWeek <= lastDay || currentWeek.getDay() !== 0) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentWeek));
      currentWeek.setDate(currentWeek.getDate() + 1);
    }
    weeks.push(week);
    if (week[6] > lastDay && week[6].getDay() === 6) break;
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === month;
  const isSelected = (date: Date) => selectedDate?.toDateString() === date.toDateString();

  return (
    <div className={`p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 ${className}`}>
      {/* Google Calendar Sync Status */}
      {isGoogleCalendarConnected && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-400/30 flex items-center gap-2">
          <span className="text-green-400">📅</span>
          <div className="flex-1">
            <span className="text-green-300 font-medium">Google Calendar Sync Active</span>
            <p className="text-xs text-white/70">Events are automatically synced with your Google Calendar</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
        >
          ←
        </button>
        
        <h2 className="text-xl font-bold text-white">
          {monthNames[month]} {year}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
        >
          →
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-white/70">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, index) => {
          const dayEvents = getEventsForDate(date);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                min-h-[80px] p-1 border border-white/10 rounded-lg cursor-pointer transition-all duration-200
                ${isCurrentMonth(date) ? 'bg-white/5' : 'bg-white/2'}
                ${isToday(date) ? 'ring-2 ring-cyan-400' : ''}
                ${isSelected(date) ? 'bg-cyan-500/20' : ''}
                hover:bg-white/10
              `}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday(date) ? 'text-cyan-400' : 
                isCurrentMonth(date) ? 'text-white' : 'text-white/40'
              }`}>
                {date.getDate()}
              </div>
              
              {/* Events for this date */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      event.color === 'blue' ? 'bg-blue-500/30 text-blue-200' :
                      event.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-200' :
                      event.color === 'purple' ? 'bg-purple-500/30 text-purple-200' :
                      event.color === 'green' ? 'bg-green-500/30 text-green-200' :
                      'bg-gray-500/30 text-gray-200'
                    }`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-white/60">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-3">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map(event => {
                const job = jobs.find(j => j.id === event.jobId);
                return (
                  <div key={event.id} className="p-3 rounded-lg bg-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{event.title}</div>
                        {job && (
                          <div className="text-sm text-white/70">
                            {job.role} • {job.status}
                          </div>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        event.color === 'blue' ? 'bg-blue-500' :
                        event.color === 'yellow' ? 'bg-yellow-500' :
                        event.color === 'purple' ? 'bg-purple-500' :
                        event.color === 'green' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/60">No events on this date</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-3 rounded-lg bg-white/5">
        <h4 className="text-sm font-medium text-white/80 mb-2">Event Types:</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-white/70">Applications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-white/70">Interviews</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-white/70">Follow-ups</span>
          </div>
          {isGoogleCalendarConnected && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-green-300">📅 Synced with Google Calendar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
