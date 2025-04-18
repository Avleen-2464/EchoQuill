import React, { useState, useEffect } from 'react';
import '../styles/Calendar.css';

const Calendar = ({ journalEntries, chatDays, currentDate, setCurrentDate }) => {
  // Default to current date if currentDate is undefined
  const current = currentDate || new Date();

  // Function to navigate to the previous or next month
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  // Function to go to the current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
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
      const date = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const hasJournal = safeJournalEntries.some(entry => {
        const entryDate = new Date(entry.date);
        const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        return entryDateStr === date;
      });
  
      const hasChat = safeChatDays.has(date);
  
      days.push(
        <div
          key={i}
          className={`calendar-day ${hasJournal ? 'completed' : ''} ${hasChat ? 'has-chat' : ''}`}
          onClick={() => hasChat && console.log('View chats for:', date)}
          title={hasJournal ? "Has journal entry" : ""}
        >
          {i}
          {hasJournal && (
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </div>
      );
    }
  
    return days;
  };
  
  
  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)}>&lt;</button>
        <h3>{current.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => navigateMonth(1)}>&gt;</button>
      </div>
      <div className="calendar-grid">
        {renderCalendar()}
      </div>
      <button onClick={goToCurrentMonth}>Today</button>
    </div>
  );
  
};
export default Calendar;