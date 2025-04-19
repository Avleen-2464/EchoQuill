import React, { createContext, useState, useContext } from 'react';

const JournalContext = createContext();

export const JournalProvider = ({ children }) => {
  const [showJournal, setShowJournal] = useState(false);

  const toggleJournal = () => {
    setShowJournal(prev => !prev);
  };

  return (
    <JournalContext.Provider value={{ showJournal, toggleJournal }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}; 