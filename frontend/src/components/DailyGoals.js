import React, { useState, useEffect } from 'react';

function DailyGoals() {
  const [goals, setGoals] = useState([
    { id: 1, text: 'Practice mindfulness daily', completed: false },
    { id: 2, text: 'Write in journal', completed: false },
    { id: 3, text: 'Exercise for 30 minutes', completed: false },
  ]);
  const [completedDays, setCompletedDays] = useState(new Set());

  // Toggle goal completion
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

  // Delete goal
  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  // Edit goal text
  const handleGoalEdit = (id, newText) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, text: newText } : goal
    ));
  };

  return (
    <div className="daily-goals">
      <h3>Daily Goals</h3>
      <ul>
        {goals.map(goal => (
          <li key={goal.id} className={`goal ${goal.completed ? 'completed' : ''}`}>
            <span onClick={() => toggleGoal(goal.id)}>{goal.text}</span>
            <button onClick={() => deleteGoal(goal.id)}>Delete</button>
            <button onClick={() => handleGoalEdit(goal.id, prompt('Edit goal text:', goal.text))}>
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DailyGoals;
