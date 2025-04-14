import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Journal.css';

const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false); // Track visibility of journal entries

  useEffect(() => {
    if (user && isVisible) {
      fetchEntries();
    }
  }, [user, isVisible]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/journal', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEntries(response.data);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to fetch journal entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleJournalVisibility = () => {
    setIsVisible((prev) => !prev); // Toggle the visibility of journal entries
  };

  return (
    <div className="journal">
      <h2>Journal</h2>
      <button onClick={toggleJournalVisibility}>
        {isVisible ? 'Close Journal' : 'Open Journal'}
      </button>

      {isVisible && (
        <div className="entries">
          {loading ? (
            <p>Loading entries...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : entries.length === 0 ? (
            <p>No journal entries found.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry._id} className="entry">
                <p>{entry.content}</p>
                <small>{new Date(entry.createdAt).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Journal;
