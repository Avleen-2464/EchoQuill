import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/ChatWindow.css';

const ChatWindow = ({ theme }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isCreatingJournal, setIsCreatingJournal] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createJournalFromConversation = async () => {
    if (messages.length === 0) return;
    
    setIsCreatingJournal(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await axios.post('http://localhost:5000/api/journals/generate-from-chat', {
        conversationHistory: conversationHistory
      }, {
        headers: { "x-auth-token": token }
      });

      if (response.status === 201) {
        alert('Journal entry created successfully!');
        // Optionally refresh the journal list here
      } else {
        throw new Error(response.data.message || 'Failed to create journal entry');
      }
    } catch (error) {
      console.error('Error creating journal:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create journal entry. Please try again.';
      alert(errorMessage);
    } finally {
      setIsCreatingJournal(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        conversationHistory: conversationHistory
      }, {headers: {"x-auth-token": token}});
      
      setIsTyping(false);
      const botMessage = { text: response.data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
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
        src={sender === 'user'
          ? 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/68.png'
          : 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png'
        }
        alt={`${sender} avatar`}
      />
    </div>
  );
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/chat/history', {
          headers: { "x-auth-token": token }
        });
  
        const fetchedMessages = response.data.messages || [];
  
        // Format messages and conversation history
        const formattedMessages = fetchedMessages.map(msg => ({
          text: msg.text,
          sender: msg.sender === 'user' ? 'user' : 'bot'
        }));
  
        const formattedHistory = fetchedMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
  
        setMessages(formattedMessages);
        setConversationHistory(formattedHistory);
  
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
  
    fetchChatHistory();
  }, []);

  return (
    <div className={`chat-window ${theme}`}>
      <div className="chat-header">
        <h3>Chat</h3>
        <button 
          className="create-journal-btn"
          onClick={createJournalFromConversation}
          disabled={messages.length === 0 || isCreatingJournal}
        >
          {isCreatingJournal ? 'Creating Journal...' : 'Create Journal Entry'}
        </button>
      </div>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {renderAvatar(message.sender)}
            <p className="message-text">{message.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <button className="send-button" onClick={sendMessage}>
          {isTyping ? 'Typing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
