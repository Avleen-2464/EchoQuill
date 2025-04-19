import React, { useState } from 'react';
import '../styles/DailyGoals.css';

function DailyGoals() {
  const [goals, setGoals] = useState([
    { id: 1, text: 'Practice mindfulness daily', completed: false },
    { id: 2, text: 'Write in journal', completed: false },
    { id: 3, text: 'Exercise for 30 minutes', completed: false },
  ]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  // Toggle goal completion
  const toggleGoal = (id) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        return { ...goal, completed: !goal.completed };
      }
      return goal;
    }));
  };

  // Delete goal
  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  // Start editing a goal
  const startEdit = (goal) => {
    setEditingId(goal.id);
    setEditText(goal.text);
  };

  // Save edited goal
  const saveEdit = () => {
    if (editText.trim()) {
      setGoals(goals.map(goal => 
        goal.id === editingId ? { ...goal, text: editText.trim() } : goal
      ));
      setEditingId(null);
      setEditText('');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Add new goal
  const addGoal = (e) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      const newGoal = {
        id: Math.max(0, ...goals.map(g => g.id)) + 1,
        text: newGoalText.trim(),
        completed: false
      };
      setGoals([...goals, newGoal]);
      setNewGoalText('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="daily-goals">
      <div className="daily-goals-header">
        <h3>Daily Goals</h3>
        <button 
          className="add-goal-button"
          onClick={() => setShowAddForm(!showAddForm)}
          title="Add new goal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {showAddForm && (
        <form className="add-goal-form" onSubmit={addGoal}>
          <input
            type="text"
            className="add-goal-input"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Enter new goal..."
            autoFocus
          />
          <button type="submit" className="add-goal-submit">
            Add
          </button>
        </form>
      )}

      <ul className="goals-list">
        {goals.map(goal => (
          <li key={goal.id} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
            <div 
              className="goal-checkbox" 
              onClick={() => toggleGoal(goal.id)}
              role="checkbox"
              aria-checked={goal.completed}
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleGoal(goal.id);
                }
              }}
            >
              {goal.completed && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            
            {editingId === goal.id ? (
              <div className="goal-edit-container">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="goal-edit-input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveEdit();
                    } else if (e.key === 'Escape') {
                      cancelEdit();
                    }
                  }}
                  onBlur={saveEdit}
                />
              </div>
            ) : (
              <span className="goal-text">{goal.text}</span>
            )}

            <div className="goal-actions">
              <button 
                className="edit-btn"
                onClick={() => startEdit(goal)}
                title="Edit goal"
                aria-label="Edit goal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button 
                className="delete-btn"
                onClick={() => deleteGoal(goal.id)}
                title="Delete goal"
                aria-label="Delete goal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DailyGoals;
