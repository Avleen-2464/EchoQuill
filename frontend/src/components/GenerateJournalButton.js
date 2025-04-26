import React, { useState } from 'react';

const GenerateJournalButton = () => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleGenerateJournal = async () => {
    setLoading(true);
    setFeedback('');

    try {
        const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/journals/generate-from-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "x-auth-token": token 
        },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback('✅ Journal generated!');
      } else {
        setFeedback(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setFeedback('❌ Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button className="btn btn-primary" onClick={handleGenerateJournal} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Journal'}
      </button>
      {feedback && <p className="mt-2">{feedback}</p>}
    </div>
  );
};

export default GenerateJournalButton;
