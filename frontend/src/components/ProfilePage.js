import React from 'react';
import Calendar from './Calendar';
import DailyGoals from './DailyGoals';
import Journal from './Journal';
import MoodTrendsChart from './MoodTrendsChart'; // adjust the path if needed
import { useJournal } from '../context/JournalContext';

const ProfilePage = () => {
  const { showJournal } = useJournal();

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="left-panel">
          <Calendar />
          <DailyGoals />
        </div>
        <div className="right-panel">
          <MoodTrendsChart />
        </div>
       <div className="journal-section open">
  <Journal />
</div>

      </div>
    </div>
  );
};

export default ProfilePage; 