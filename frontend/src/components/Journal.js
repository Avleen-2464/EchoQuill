import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/journal');
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/journal', { content: newEntry });
      setNewEntry('');
      fetchEntries();
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  return (
    <div className="journal">
      <h2>Journal Entries</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Write your thoughts..."
        />
        <button type="submit">Add Entry</button>
      </form>
      <div className="entries">
        {entries.map((entry) => (
          <div key={entry._id} className="entry">
            <p>{entry.content}</p>
            <small>{new Date(entry.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journal;
