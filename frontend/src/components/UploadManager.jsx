import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, Trash2, CheckCircle2, ShieldAlert, Lock, LogOut } from 'lucide-react';
import axios from 'axios';

const UploadManager = ({ mode, onUserFileUpload, userPdfFile }) => {
  const [uploading, setUploading] = useState(false);
  const [devStatus, setDevStatus] = useState(null);
  const fileInputRef = useRef(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('dev_token');
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setUploading(true);
    setDevStatus(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/developer/login`, {
        username,
        password
      });
      localStorage.setItem('dev_token', response.data.token);
      setIsAuthenticated(true);
      setDevStatus(null);
    } catch (error) {
      setDevStatus({ type: 'error', message: error.response?.data?.detail || 'Login failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dev_token');
    setIsAuthenticated(false);
    setDevStatus(null);
    setUsername('');
    setPassword('');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('dev_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleDevUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setDevStatus(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/developer/upload`, formData, {
        headers: getAuthHeaders()
      });
      setDevStatus({ type: 'success', message: response.data.message });
    } catch (error) {
      setDevStatus({ type: 'error', message: error.response?.data?.detail || 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearKnowledge = async () => {
    if (!window.confirm('Are you sure you want to clear ALL system-wide knowledge? This cannot be undone.')) return;
    
    setUploading(true);
    setDevStatus(null);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/developer/clear`, {}, {
        headers: getAuthHeaders()
      });
      setDevStatus({ type: 'success', message: response.data.message });
    } catch (error) {
      setDevStatus({ type: 'error', message: error.response?.data?.detail || 'Clear failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }

    if (mode === 'developer') {
      handleDevUpload(file);
    } else {
      onUserFileUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUserFile = () => {
    onUserFileUpload(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
        {mode === 'developer' ? 'System Override' : 'Document Context'}
      </h2>

      {mode === 'developer' ? (
        <div style={{ flex: 1 }}>
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%' }}>
                  <Lock size={32} color="#6366f1" />
                </div>
              </div>
              <h3 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '16px' }}>System Authentication</h3>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="chat-input"
                style={{ borderRadius: '8px' }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="chat-input"
                style={{ borderRadius: '8px' }}
                required
              />
              <button 
                type="submit" 
                className="glass-button" 
                style={{ width: '100%', marginTop: '8px' }}
                disabled={uploading}
              >
                {uploading ? 'Authenticating...' : 'Login to System Override'}
              </button>
              
              {devStatus && (
                <div style={{
                  marginTop: '12px', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444'
                }}>
                  {devStatus.message}
                </div>
              )}
            </form>
          ) : (
            <div className="animate-fade-in">
              <div className="system-warning" style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
                display: 'flex', alignItems: 'flex-start', gap: '8px'
              }}>
                <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Developer Mode Active</strong><br/>
                  Files uploaded here are saved permanently to the server's vector database to establish global academic policies.
                </div>
              </div>
              
              <input 
                 type="file" 
                 accept=".pdf" 
                 style={{ display: 'none' }} 
                 ref={fileInputRef}
                 onChange={handleFileChange} 
              />
              <button 
                className="glass-button" 
                style={{ width: '100%', marginBottom: '12px' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <UploadCloud size={20} />
                {uploading ? 'Ingesting...' : 'Upload Master Policy PDF'}
              </button>

              <button 
                className="glass-button glass-button-secondary" 
                style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}
                onClick={handleClearKnowledge}
                disabled={uploading}
              >
                <Trash2 size={20} color="#ef4444" />
                Clear System Knowledge
              </button>

              {devStatus && (
                <div className="animate-fade-in" style={{
                  marginBottom: '16px', padding: '12px', borderRadius: '8px', fontSize: '14px',
                  background: devStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${devStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: devStatus.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                  {devStatus.message}
                </div>
              )}
              
              <button 
                className="glass-button glass-button-secondary" 
                style={{ width: '100%', fontSize: '13px', opacity: 0.8 }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            You can optionally upload a temporary reference document. 
            <br/><br/>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} /> Zero Retention Policy: 
            </span>
            Files uploaded here are processed entirely in memory and immediately destroyed after your query.
          </p>
          
          <input 
             type="file" 
             accept=".pdf" 
             style={{ display: 'none' }} 
             ref={fileInputRef}
             onChange={handleFileChange} 
          />

          {!userPdfFile ? (
            <button 
              className="glass-button glass-button-secondary" 
              style={{ width: '100%', borderStyle: 'dashed' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={20} color="var(--text-secondary)" />
              Attach Temporary PDF
            </button>
          ) : (
            <div className="animate-fade-in" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
              borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FileIcon size={18} color="#6366f1" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '14px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {userPdfFile.name}
                </span>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              </div>
              <button 
                onClick={removeUserFile}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                title="Remove file"
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadManager;
