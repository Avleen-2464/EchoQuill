import React from 'react';
import Calendar from './Calendar';
import DailyGoals from './DailyGoals';
import Journal from './Journal';
import MoodTrendsChart from './MoodTrendsChart'; // adjust the path if needed
import Navbar from './Navbar';
import { useJournal } from '../context/JournalContext';
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const { showJournal } = useJournal();
  const { isDarkMode } = useTheme();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <Navbar />
      <div className="dashboard" style={{
        flex: 1,
        padding: '20px',
        marginTop: '64px',
      }}>
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <div className="left-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px var(--shadow-color)',
              padding: '16px',
              border: '1px solid var(--border-color)',
            }}>
              <Calendar />
            </div>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px var(--shadow-color)',
              padding: '16px',
              border: '1px solid var(--border-color)',
            }}>
              <DailyGoals />
            </div>
          </div>
          <div className="right-panel" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px var(--shadow-color)',
            padding: '16px',
            border: '1px solid var(--border-color)',
          }}>
            <MoodTrendsChart />
          </div>
          <div className="journal-section" style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px var(--shadow-color)',
            padding: '16px',
            marginTop: '16px',
            border: '1px solid var(--border-color)',
          }}>
            <Journal />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 