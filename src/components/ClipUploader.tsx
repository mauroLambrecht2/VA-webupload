import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './ClipUploader.css';

// API Configuration - Backend URL for different domains
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://va-expressupload.onrender.com' // Your backend domain
  : 'http://localhost:8000'; // Backend URL for development

const MAX_SIZE_MB = 500;
const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
  'video/x-matroska', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'
];

const ClipUploader: React.FC = () => {
  const { user, loading, login, logout, refreshUser, error: authError } = useUser();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFile = (file: File) => {
    setError('');
    setResult(null);
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only video files are supported');
      return;
    }
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit`);
      return;
    }
    
    // Check if user is authenticated before upload
    if (!user) {
      setError('Please login with Discord to upload videos');
      // Automatically trigger Discord login after 2 seconds
      setTimeout(() => {
        login();
      }, 2000);
      return;
    }
    
    uploadFile(file);
  };
  const uploadFile = (file: File) => {
    setUploading(true);
    setProgress(0);
    setUploadComplete(false);
    setUploadStartTime(Date.now());
    
    // Estimate initial upload time based on file size
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedSeconds = Math.max(10, fileSizeMB * 2); // Rough estimate: 2 seconds per MB, minimum 10 seconds
    setEstimatedTimeRemaining(`~${Math.ceil(estimatedSeconds / 60)}m ${Math.ceil(estimatedSeconds % 60)}s`);
    
    const formData = new FormData();
    formData.append('video', file);
    
    // Progress tracking with time estimation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        
        const elapsed = (Date.now() - uploadStartTime) / 1000;
        const progressPerSecond = prev / elapsed;
        const remainingProgress = 100 - prev;
        const estimatedRemainingSeconds = remainingProgress / progressPerSecond;
        
        if (estimatedRemainingSeconds > 0 && !isNaN(estimatedRemainingSeconds)) {
          const minutes = Math.floor(estimatedRemainingSeconds / 60);
          const seconds = Math.ceil(estimatedRemainingSeconds % 60);
          setEstimatedTimeRemaining(minutes > 0 ? `~${minutes}m ${seconds}s` : `~${seconds}s`);
        }
        
        return prev + Math.random() * 15;
      });
    }, 200);

    // Create AbortController for timeout
    const abortController = new AbortController();
    const uploadTimeout = setTimeout(() => {
      abortController.abort();
    }, 5 * 60 * 1000); // 5 minute timeout

    fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: abortController.signal,
    })
    .then(async (res) => {
      clearTimeout(uploadTimeout);
      clearInterval(progressInterval);
      setProgress(100);
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      // Check if response is actually JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await res.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned ${res.status}: ${textResponse.substring(0, 200)}`);
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      return res.json();
    })    .then((data) => {
      setResult(data);
      setError(''); // Clear any previous errors
      setUploadComplete(true);
        // Show checkmark animation for 2 seconds, then reset
      setTimeout(() => {
        setUploadComplete(false);
        setResult(null);
      }, 2000);
    })
    .catch((err) => {
      clearTimeout(uploadTimeout);
      if (err.name === 'AbortError') {
        setError('Upload timeout. Please try with a smaller file.');
      } else {
        const errorMsg = err.message || 'Upload failed. Please try again.';
        setError(errorMsg);
      }
    })
    .finally(() => {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };  const handleMyClipsClick = () => {
    navigate('/clips');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Force a page refresh to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Still refresh the page to clear state
      window.location.reload();
    }
  };

  return (
    <div 
      className="clip-uploader"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <div className={`drag-overlay ${dragActive ? 'active' : ''}`}>
        <div className="drag-overlay-content">
          <h2>Drop your video here</h2>
          <p>Release to upload your clip</p>
        </div>
      </div>

      {/* Logo */}
      <div className="logo">
        <div className="logo-image">VA</div>
        <div className="logo-text">VillainArc</div>
      </div>

      {/* User Auth - Simple addition */}
      <div className="auth-section">
        {loading ? (
          <div className="auth-loading">Loading...</div>        ) : user ? (
          <div className="user-card">
            <div className="user-avatar-mini">
              <img src={user.avatar} alt="Avatar" />
            </div>
            <div className="user-info-mini">
              <span className="user-name">{user.username}</span>
              <div className="quota-mini">
                <div className="quota-bar">
                  <div 
                    className="quota-fill"
                    style={{ width: `${Math.min((user.uploadStats.quotaPercentUsed || 0) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="quota-text">
                  {((user.uploadStats.totalSize || 0) / (1024 * 1024 * 1024)).toFixed(1)}GB/5GB
                </span>
              </div>
            </div>            <div className="user-actions-mini">
              <button onClick={handleMyClipsClick} className="action-btn" title="My Clips">📁</button>
              <button onClick={handleLogout} className="action-btn" title="Logout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H4v16h10v-2h2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h10z"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button className="discord-login-btn" onClick={login}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
            </svg>
            Login with Discord
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      
      <div className="content">
        <div className="main-section">
          <div className="main-title">
            <h1>Upload Your Clip</h1>
            <p className="main-subtitle">Share videos with the VillainArc community</p>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-title">File Types</div>
              <div className="info-desc">MP4, WebM, MOV, MKV, AVI, FLV, WMV</div>
            </div>
            <div className="info-item">
              <div className="info-title">Max Size</div>
              <div className="info-desc">Up to {MAX_SIZE_MB}MB per file</div>
            </div>
            <div className="info-item">
              <div className="info-title">Auto Sharing</div>
              <div className="info-desc">Discord notification on upload</div>
            </div>
          </div>

          <div className="upload-action">
            <div className="upload-prompt">
              {user ? 'Drop your video file here' : 'Login with Discord to upload videos'}
            </div>
            <div className="upload-hint">
              {user ? 'Files are automatically shared with unique secure links' : 'Authentication required for secure uploads'}
            </div>
            {user && (
              <button className="upload-btn" onClick={handleUploadClick}>
                Choose File
              </button>
            )}
          </div>
        </div>
      </div>      {uploading && (
        <div className="progress-container">
          <div className="progress-spinner"></div>
        </div>
      )}

      {authError && (
        <div className="error-container">
          <div className="error-message">
            {authError}
          </div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <div className="error-message">
            {error}
          </div>
        </div>
      )}      {uploadComplete && (
        <div className="upload-success">
          <div className="checkmark-container">
            <div className="checkmark">
              <svg viewBox="0 0 52 52" className="checkmark-svg">
                <circle cx="26" cy="26" r="25" fill="none" className="checkmark-circle"/>
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className="checkmark-check"/>
              </svg>
            </div>
            <h3>Upload Complete!</h3>
            <p>Opening your clip...</p>
          </div>
        </div>
      )}
      
      <div className="footer">
        VillainArc © 2025 • Secure Clip Sharing
      </div>
    </div>
  );
};

export default ClipUploader;
