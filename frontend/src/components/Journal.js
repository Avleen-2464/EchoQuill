import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useJournal } from "../context/JournalContext";
import axios from "axios";
import "../styles/Journal.css";

const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showJournal, toggleJournal } = useJournal();
  const [activeEntry, setActiveEntry] = useState(null); // For modal (optional)

  useEffect(() => {
    if (user && showJournal) {
      fetchEntries();
    }
  }, [user, showJournal]);
  
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/journals", {
        headers: { "x-auth-token": token },
      });
      setEntries(data);
    } catch (err) {
      console.error("Error fetching journal entries:", err);
      setError("Failed to fetch journal entries. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const closeJournal = () => {
    toggleJournal(); // <== this will flip showJournal in context
  };
  

  const openEntryModal = (entry) => {
    setActiveEntry(entry);
  };

  const closeEntryModal = () => {
    setActiveEntry(null);
  };

  return (
    <div className={`journal-container ${showJournal ? "open" : "closed"}`}>

      <div className="journal">
        <div className="journal-header">
          <h2 className="journal-title">Journal</h2>
          <button
            className="journal-close-button"
            onClick={closeJournal}
            aria-label="Close Journal"
          >
            &lt;
          </button>
        </div>

        <div className="journal-list">
          {loading ? (
            <p>Loading entries...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : entries.length === 0 ? (
            <p>No journal entries found.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry._id}
                className="journal-entry"
                onClick={() => openEntryModal(entry)}
              >
                <div className="journal-date">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
                <div className="journal-preview">
                  {entry.entry?.substring(0, 100)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for detailed entry view */}
      {activeEntry && (
        <div className="journal-modal" onClick={closeEntryModal}>
          <div
            className="journal-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="journal-modal-header">
              <span className="journal-modal-date">
                {new Date(activeEntry.createdAt).toLocaleString()}
              </span>
              <button className="close-button" onClick={closeEntryModal}>
                ×
              </button>
            </div>
            <div className="journal-modal-body">
              <p>{activeEntry.entry}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
