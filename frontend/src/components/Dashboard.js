import React, { useState } from 'react';
import Calendar from './Calendar';
import DailyGoals from './DailyGoals';
import ChatWindow from './ChatWindow';
import Journal from './Journal';

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [journalEntries, setJournalEntries] = useState([]);
  const [chatDays, setChatDays] = useState(new Set());

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="left-panel">
          <Calendar 
            journalEntries={journalEntries}
            chatDays={chatDays}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
          <DailyGoals />
        </div>
        <div className="right-panel">
          <ChatWindow />
        </div>
        <div className="journal-section">
          <Journal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 