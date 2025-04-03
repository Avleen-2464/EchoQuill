import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showJournal, setShowJournal] = useState(false);
  const [goals, setGoals] = useState([
    { id: 1, text: 'Practice mindfulness daily', completed: false },
    { id: 2, text: 'Write in journal', completed: false },
    { id: 3, text: 'Exercise for 30 minutes', completed: false },
  ]);
  const [chatDays] = useState(new Set(['2024-03-31', '2024-03-30', '2024-03-29']));
  const messagesEndRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingGoal, setEditingGoal] = useState(null);
  const [completedDays, setCompletedDays] = useState(new Set());

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Dummy journal entries
  const journalEntries = [
    {
      id: 1,
      date: 'March 31, 2024',
      preview: 'Today was a productive day. I felt more energetic and focused on my tasks...',
      content: `Dear Diary,

Today was a truly remarkable day. I woke up feeling refreshed and energized, which is quite unusual for a Monday morning. The sun was streaming through my window, and I could hear birds chirping outside - it felt like a good omen.

I started my day with a 20-minute meditation session, which helped me center my thoughts. The conversation with my therapist yesterday really helped me understand my anxiety patterns better. I'm learning to recognize the early signs of stress and handle them more effectively.

At work, I managed to complete three major tasks that were pending. My colleague Sarah noticed my improved mood and commented on how I seemed more confident lately. It's amazing how small changes in mindset can make such a big difference.

I'm grateful for:
- The support of my friends and family
- The progress I'm making in therapy
- The beautiful weather today
- My ability to stay focused and productive

Tomorrow, I'm planning to try that new yoga class I've been thinking about. Here's to continued growth and self-discovery.

Until tomorrow,
Me`
    },
    {
      id: 2,
      date: 'March 30, 2024',
      preview: 'Had a good conversation with friends. Feeling grateful for the support system...',
      content: `Dear Diary,

The weekend was exactly what I needed. Spent the morning catching up with my best friend over coffee. We talked about everything - from our career goals to our personal growth journeys. It's refreshing to have someone who understands and supports you unconditionally.

In the afternoon, I attended a mindfulness workshop. The instructor taught us some new breathing techniques that I'm excited to incorporate into my daily routine. The group discussion about managing stress was particularly enlightening.

I'm learning to be kinder to myself. Instead of beating myself up over small mistakes, I'm trying to view them as learning opportunities. It's not easy, but I'm making progress.

Today's highlights:
- Quality time with friends
- Learning new mindfulness techniques
- A peaceful evening walk
- A good book before bed

Feeling optimistic about the week ahead.

With gratitude,
Me`
    },
    {
      id: 3,
      date: 'March 29, 2024',
      preview: 'Experienced some stress at work, but managed to handle it well...',
      content: `Dear Diary,

Today was challenging but also enlightening. Work was particularly stressful with a major deadline looming. However, I'm proud of how I handled the pressure. Instead of panicking, I broke down the tasks into manageable chunks and tackled them one by one.

My therapist's advice about using the "5-4-3-2-1" grounding technique really helped when I felt overwhelmed. It's amazing how focusing on your senses can bring you back to the present moment.

I also had a breakthrough in understanding my perfectionist tendencies. While striving for excellence is good, I'm learning that it's okay to make mistakes and ask for help.

Today's lessons:
- Breaking down big tasks helps reduce anxiety
- Asking for help is a sign of strength, not weakness
- Self-compassion is essential for growth
- Progress is more important than perfection

Tomorrow is a new day, and I'm ready to face it with a fresh perspective.

Take care,
Me`
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleGoal = (id) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        const newCompleted = !goal.completed;
        if (newCompleted) {
          // Add today's date to completed days when a goal is completed
          const today = new Date().toISOString().split('T')[0];
          setCompletedDays(prev => new Set([...prev, today]));
        }
        return { ...goal, completed: newCompleted };
      }
      return goal;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5000/chat', {
        message: input,
      });
      setIsTyping(false);
      const botMessage = { text: response.data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      const errorMessage = { text: 'Sorry, there was an error processing your message.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderAvatar = (sender) => (
    <div className={`avatar ${sender}`}>
      <img 
        src={sender === 'user' ? 
          'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/68.png' : 
          'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png'
        } 
        alt={`${sender} avatar`}
      />
    </div>
  );

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasJournal = journalEntries.some(entry => {
        // Parse the journal entry date (e.g., "March 31, 2024")
        const entryDate = new Date(entry.date);
        const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        return entryDateStr === date;
      });
      const hasChat = chatDays.has(date);
      days.push(
        <div 
          key={i} 
          className={`calendar-day ${hasJournal ? 'completed' : ''} ${hasChat ? 'has-chat' : ''}`}
          onClick={() => hasChat && console.log('View chats for:', date)}
          title={hasJournal ? "Has journal entry" : ""}
        >
          {i}
          {hasJournal && (
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          )}
        </div>
      );
    }

    return days;
  };

  const handleGoalEdit = (id, newText) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, text: newText } : goal
    ));
  };

  const isCurrentMonth = (date) => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  };

  const canNavigateForward = () => {
    const now = new Date();
    return currentDate.getMonth() < now.getMonth() || 
           currentDate.getFullYear() < now.getFullYear();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          <span>EchoQuill</span>
        </div>
        <div className="navbar-right">
          <div 
            className={`theme-switch ${theme === 'dark' ? 'dark' : ''}`}
            onClick={toggleTheme}
          >
            <svg className="sun-icon icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
            </svg>
            <svg className="moon-icon icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
            </svg>
          </div>
        </div>
      </nav>

      <div className="chat-container">
        <div className="controls-container">
          <button className="journal-toggle" onClick={() => setShowJournal(!showJournal)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16z"/>
              <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
            </svg>
          </button>
        </div>

        <div className="calendar-section">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={() => navigateMonth(-1)} title="Previous month">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <button 
                onClick={goToCurrentMonth} 
                title="Current month"
                disabled={isCurrentMonth(currentDate)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </button>
              <span className="current-month">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => navigateMonth(1)} 
                title="Next month"
                disabled={!canNavigateForward()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.59 6L12 7.41 16.17 12 12 16.59 10.59 18l6-6z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day day-header">{day.charAt(0)}</div>
            ))}
            {renderCalendar()}
          </div>

          <div className="goals-section">
            <div className="goals-header">
              <h3>Daily Goals</h3>
              <button onClick={() => {
                const newGoal = { 
                  id: Date.now(), 
                  text: 'New Goal', 
                  completed: false 
                };
                setGoals([...goals, newGoal]);
                setEditingGoal(newGoal.id);
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div 
                  className={`goal-checkbox ${goal.completed ? 'checked' : ''}`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  {goal.completed && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </div>
                {editingGoal === goal.id ? (
                  <input
                    className="goal-text"
                    value={goal.text}
                    onChange={(e) => handleGoalEdit(goal.id, e.target.value)}
                    onBlur={() => setEditingGoal(null)}
                    onKeyPress={(e) => e.key === 'Enter' && setEditingGoal(null)}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="goal-text"
                    onClick={() => setEditingGoal(goal.id)}
                  >
                    {goal.text}
                  </span>
                )}
                <div className="goal-actions">
                  <button 
                    className="goal-delete"
                    onClick={() => deleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-section">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {renderAvatar(msg.sender)}
                <div className="message-content">
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                {renderAvatar('bot')}
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-container">
            <input
              className="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={`journal-section ${showJournal ? 'open' : ''}`}>
          <div className="journal-header">
            <div className="journal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16z"/>
                <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
              </svg>
            </div>
            <div className="journal-title">Your Journal</div>
            <button className="close-button" onClick={() => setShowJournal(false)}>×</button>
          </div>
          <div className="journal-list">
            {journalEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="journal-entry"
                onClick={() => {
                  setSelectedJournal(entry);
                  setShowJournalModal(true);
                }}
              >
                <div className="journal-date">{entry.date}</div>
                <div className="journal-preview">{entry.preview}</div>
              </div>
            ))}
          </div>
        </div>

        {showJournalModal && selectedJournal && (
          <div className="journal-modal">
            <div className="journal-modal-content">
              <div className="journal-modal-header">
                <div className="journal-modal-date">{selectedJournal.date}</div>
                <button className="close-button" onClick={() => setShowJournalModal(false)}>×</button>
              </div>
              <div className="journal-modal-body">
                {selectedJournal.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
