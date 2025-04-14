import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/ChatWindow.css';

const ChatWindow = ({ theme }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // setIsTyping(true);

    // try {
    //   const token = localStorage.getItem('token');
    //   console.log(token);
    //   const response = await axios.post('http://localhost:5000/api/chat', {
    //     message: input,
    //   }, {headers: {"x-auth-token": token}});
    //   setIsTyping(false);
    //   const botMessage = { text: response.data.reply, sender: 'bot' };
    //   setMessages(prev => [...prev, botMessage]);
    // } catch (error) {
    //   console.error('Error sending message:', error);
    //   setIsTyping(false);
    //   const errorMessage = { text: 'Sorry, there was an error processing your message.', sender: 'bot' };
    //   setMessages(prev => [...prev, errorMessage]);
    // }
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token'); // Verify this key matches where you store the token.
      console.log(token);
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
      }, {headers: {"x-auth-token": token}});
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
        src={sender === 'user'
          ? 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/68.png'
          : 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png'
        }
        alt={`${sender} avatar`}
      />
    </div>
  );

  return (
    <div className={`chat-window ${theme}`}>
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
