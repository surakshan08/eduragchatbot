import React, { useState } from 'react';
import { BookOpen, Settings } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import UploadManager from './components/UploadManager';

function App() {
  const [mode, setMode] = useState('user'); // 'user' or 'developer'
  const [userPdfFile, setUserPdfFile] = useState(null);

  const handleUserPdfUpload = (file) => {
    setUserPdfFile(file);
  };

  return (
    <div className="app-container">
      <header className="header glass-panel animate-fade-in">
        <h1>
          <BookOpen className="text-accent" size={28} color="#6366f1" />
          EDURAG <span style={{fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)', marginTop: '6px'}}>(Campus Assistance)</span>
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`glass-button ${mode === 'user' ? '' : 'glass-button-secondary'}`}
            onClick={() => setMode('user')}
          >
            Chat Mode
          </button>
          <button 
            className={`glass-button ${mode === 'developer' ? '' : 'glass-button-secondary'}`}
            onClick={() => setMode('developer')}
          >
            <Settings size={18} />
            System Override
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="sidebar animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <UploadManager 
            mode={mode} 
            onUserFileUpload={handleUserPdfUpload}
            userPdfFile={userPdfFile}
          />
        </div>
        
        <div className="chat-area animate-fade-in" style={{ animationDelay: '0.2s', height: 'calc(100vh - 150px)' }}>
          <ChatInterface 
            userPdfFile={userPdfFile} 
          />
        </div>
      </main>
    </div>
  );
}

export default App;
