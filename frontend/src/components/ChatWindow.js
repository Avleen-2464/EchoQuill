import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/ChatWindow.css";

const ChatWindow = ({ theme, userGender }) => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isCreatingJournal, setIsCreatingJournal] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createJournalFromConversation = async () => {
    if (messages.length === 0) return;

    setIsCreatingJournal(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await axios.post(
        "http://localhost:5000/api/journals/generate-from-chat",
        {
          conversationHistory: conversationHistory,
        },
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.status === 201) {
        alert("Journal entry created successfully!");
      } else {
        throw new Error(
          response.data.message || "Failed to create journal entry"
        );
      }
    } catch (error) {
      console.error("Error creating journal:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create journal entry. Please try again.";
      alert(errorMessage);
    } finally {
      setIsCreatingJournal(false);
    }
  };

  const sendMessage = async (customInput) => {
    const textToSend = customInput !== undefined ? customInput : input;
    if (!textToSend.trim()) return;

    const userMessage = { text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: textToSend },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        {
          message: textToSend,
          conversationHistory: conversationHistory,
        },
        { headers: { "x-auth-token": token } }
      );

      const botMessage = { text: response.data.reply, sender: "bot" };

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, botMessage]);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: response.data.reply },
        ]);
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      const errorMessage = {
        text: "Sorry, there was an error processing your message.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderAvatar = (sender) => {
    if (sender === "user") {
      let avatarUrl;
      if (userGender === "male") {
        avatarUrl =
          "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png";
      } else if (userGender === "female") {
        avatarUrl =
          "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/68.png";
      } else {
        avatarUrl =
          "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png";
      }
      return (
        <div className="avatar user">
          <img src={avatarUrl} alt="user avatar" />
        </div>
      );
    } else {
      return (
        <div className="avatar bot">
          <img
            src="https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png"
            alt="bot avatar"
          />
        </div>
      );
    }
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/chat/history",
          {
            headers: { "x-auth-token": token },
          }
        );

        const fetchedMessages = response.data.messages || [];

        const formattedMessages = fetchedMessages.map((msg) => ({
          text: msg.text,
          sender: msg.sender === "user" ? "user" : "bot",
        }));

        const formattedHistory = fetchedMessages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }));

        setMessages(formattedMessages);
        setConversationHistory(formattedHistory);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  };

  return (
    <div className={`chat-window ${theme}`}>
      <div className="chat-header">
        <h3>Chat</h3>
        <button
          className="create-journal-btn"
          onClick={createJournalFromConversation}
          disabled={messages.length === 0 || isCreatingJournal}
        >
          {isCreatingJournal ? "Creating Journal..." : "Create Journal Entry"}
        </button>
      </div>

      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {renderAvatar(message.sender)}
            <p className="message-text">{message.text}</p>
          </div>
        ))}

        {isTyping && (
          <div className="message bot typing-indicator">
            {renderAvatar("bot")}
            <p className="message-text typing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </p>
          </div>
        )}

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
        <button
          className={`mic-button ${isListening ? "recording" : ""}`}
          onClick={startListening}
          title="Speak"
        >
          <i className="fa-solid fa-microphone mic-icon"></i>
        </button>

        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
