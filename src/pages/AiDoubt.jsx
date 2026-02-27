import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AiDoubt.css';

const AiDoubt = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Assistant. I'm here to help you with any academic doubts, questions about subjects, explanations, or even study tips. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('general');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'subject', label: 'Subject Help' },
    { value: 'assignment', label: 'Assignment Help' },
    { value: 'concept', label: 'Concept Clarification' },
    { value: 'exam', label: 'Exam Preparation' },
    { value: 'career', label: 'Career Guidance' }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      category: category
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/ask-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: inputValue,
          category: category,
          userType: user?.role,
          context: messages.slice(-3).map(m => ({ role: m.sender, content: m.text }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const aiMessage = {
        id: messages.length + 2,
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        sources: data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I couldn't process your question at the moment. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="ai-doubt-container">
      <div className="ai-doubt-header">
        <div className="header-content">
          <div className="header-icon">
            <Lightbulb size={32} />
          </div>
          <div className="header-text">
            <h1>AI Assistant - Ask Your Doubts</h1>
            <p>Get instant help with academic questions and concepts</p>
          </div>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}</span>
          <small>{user?.role === 'student' ? 'Student' : 'Faculty Member'}</small>
        </div>
      </div>

      <div className="ai-doubt-main">
        {/* Sidebar with categories */}
        <div className="doubt-sidebar">
          <h3>Question Categories</h3>
          <div className="categories-list">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`category-btn ${category === cat.value ? 'active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="quick-tips">
            <h3>💡 Quick Tips</h3>
            <ul>
              <li>Ask specific questions for better answers</li>
              <li>Include relevant details and context</li>
              <li>Ask follow-up questions anytime</li>
              <li>Use different categories for better results</li>
            </ul>
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-container">
          <div className="messages-area">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-icon">
                  {message.sender === 'ai' ? (
                    <Lightbulb size={20} />
                  ) : (
                    <MessageCircle size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">
                      {message.sender === 'ai' ? 'AI Assistant' : 'You'}
                    </span>
                    <span className="timestamp">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="message-text">{message.text}</div>
                  {message.sources && (
                    <div className="message-sources">
                      <small>📚 Sources: {message.sources.join(', ')}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message ai loading-message">
                <div className="message-icon">
                  <Loader size={20} className="spinner" />
                </div>
                <div className="message-content">
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick question suggestions */}
          {messages.length <= 2 && (
            <div className="quick-questions">
              <p>Try asking:</p>
              <button
                className="quick-q-btn"
                onClick={() => handleQuickQuestion('How do I understand derivatives?')}
              >
                How do I understand derivatives?
              </button>
              <button
                className="quick-q-btn"
                onClick={() => handleQuickQuestion('Explain the concept of photosynthesis')}
              >
                Explain photosynthesis
              </button>
              <button
                className="quick-q-btn"
                onClick={() => handleQuickQuestion('What are the best study tips?')}
              >
                Best study tips
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="input-area">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
              title="Select question category"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question or doubt here... (Press Enter to send, Shift+Enter for new line)"
                disabled={loading}
                className="doubt-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="send-btn"
                title="Send message"
              >
                {loading ? <Loader size={20} className="spinner" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDoubt;
