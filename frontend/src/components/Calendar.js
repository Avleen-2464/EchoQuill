import React, { useState, useEffect } from 'react';

// Calendar component
const Calendar = ({ journalEntries, chatDays, currentDate, setCurrentDate }) => {
  // Function to navigate to the previous or next month
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  // Function to go to the current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Function to render the calendar grid
  const renderCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasJournal = journalEntries.some(entry => {
        // Parse the journal entry date (e.g., "March 31, 2024")
        const entryDate = new Date(entry.date);
        const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        return entryDateStr === date;
      });
      const hasChat = chatDays.has(date);
      days.push(
        <div 
          key={i} 
          className={`calendar-day ${hasJournal ? 'completed' : ''} ${hasChat ? 'has-chat' : ''}`}
          onClick={() => hasChat && console.log('View chats for:', date)}
          title={hasJournal ? "Has journal entry" : ""}
        >
          {i}
          {hasJournal && (
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)}>Previous</button>
        <div className="calendar-month">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => navigateMonth(1)}>Next</button>
        <button onClick={goToCurrentMonth}>Current Month</button>
      </div>
      <div className="calendar-grid">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default Calendar;
