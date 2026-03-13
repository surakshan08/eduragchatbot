import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const ChatInterface = ({ userPdfFile }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am EDURAG, your Campus Assistance AI. Ask me about any academic policy! I am fully confident and provide answers straight from the verified documents.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim();
    setInput('');
    
    // Add User message immediately
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('query', query);
      if (userPdfFile) {
        formData.append('file', userPdfFile);
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ask`, formData);

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**Error**: ${error.response?.data?.detail || 'Failed to connect to the EDURAG backend.'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Chat History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`animate-fade-in`} 
            style={{ 
              display: 'flex', 
              gap: '16px', 
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' 
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(30, 41, 59, 1)',
              border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: msg.role === 'user' ? '0 4px 12px var(--accent-glow)' : 'none'
            }}>
              {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="#8b5cf6" />}
            </div>
            
            <div style={{
              background: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
              border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
              padding: '16px', borderRadius: '16px', 
              borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
              maxWidth: '80%', color: 'var(--text-primary)', lineHeight: 1.6,
              fontSize: '15px'
            }}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '16px' }}>
             <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(30, 41, 59, 1)', border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={20} color="#8b5cf6" />
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
              padding: '16px', borderRadius: '16px', borderTopLeftRadius: '4px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <Loader2 size={18} className="animate-spin" color="#6366f1" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Consulting policies...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(15, 23, 42, 0.4)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="glass-input" 
            placeholder={userPdfFile ? `Ask a question regarding ${userPdfFile.name}...` : "Ask a question about campus policy..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button 
            type="submit" 
            className="glass-button" 
            disabled={!input.trim() || loading}
            style={{ padding: '0 20px' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
