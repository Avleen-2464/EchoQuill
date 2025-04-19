import React from 'react';
import '../styles/Calendar.css';

const Calendar = ({ journalEntries, chatDays, currentDate, setCurrentDate }) => {
  const current = currentDate || new Date();
  const today = new Date();

  // Function to check if a date is in the future
  const isFutureMonth = (date) => {
    const now = new Date();
    return date.getFullYear() > now.getFullYear() ||
      (date.getFullYear() === now.getFullYear() && date.getMonth() > now.getMonth());
  };

  // Function to navigate to the previous or next month
  const navigateMonth = (direction) => {
    const newDate = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    if (!isFutureMonth(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Function to render weekday headers
  const renderWeekdays = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays.map(day => (
      <div key={day} className="calendar-weekday">{day}</div>
    ));
  };

  // Function to render the calendar grid
  const renderCalendar = () => {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const days = [];
  
    const safeJournalEntries = journalEntries || [];
    const safeChatDays = chatDays || new Set();
  
    // Add empty cells for padding before the 1st day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
  
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(current.getFullYear(), current.getMonth(), i);
      const date = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const hasJournal = safeJournalEntries.some(entry => {
        const entryDate = new Date(entry.date);
        const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        return entryDateStr === date;
      });
  
      const hasChat = safeChatDays.has(date);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isPast = currentDate < today;
      const isFuture = currentDate > today;

      const classNames = [
        'calendar-day',
        isToday ? 'today' : '',
        hasJournal ? 'has-journal' : '',
        hasChat ? 'has-chat' : '',
        isPast ? 'past' : '',
        isFuture ? 'future' : ''
      ].filter(Boolean).join(' ');
  
      days.push(
        <div
          key={i}
          className={classNames}
          onClick={() => hasChat && console.log('View chats for:', date)}
        >
          <span className="day-number">{i}</span>
          {(hasJournal || hasChat) && <div className="activity-indicator"></div>}
        </div>
      );
    }
  
    return days;
  };
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          className="calendar-nav-button"
          onClick={() => navigateMonth(-1)}
        >
          ←
        </button>
        <h3 className="calendar-month-year">
          {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        {!isFutureMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1)) && (
          <button 
            className="calendar-nav-button"
            onClick={() => navigateMonth(1)}
          >
            →
          </button>
        )}
      </div>
      <div className="calendar-weekdays">
        {renderWeekdays()}
      </div>
      <div className="calendar-grid">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default Calendar;