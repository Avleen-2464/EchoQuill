import React from 'react';
import Calendar from './Calendar';
import DailyGoals from './DailyGoals';
import ChatWindow from './ChatWindow';
import Journal from './Journal';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="left-panel">
          <Calendar />
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