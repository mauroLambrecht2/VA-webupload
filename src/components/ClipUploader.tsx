import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTaskManager } from './TaskManager';
import AzureUploadService from '../services/AzureUploadService';
import './ClipUploader.css';

// API Configuration - Backend URL for different domains
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://va-expressupload.onrender.com' // Your backend domain
  : 'http://localhost:8000'; // Backend URL for development

const MAX_SIZE_MB = 300; // Updated to 300MB
const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
  'video/x-matroska', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'
];

const ClipUploader: React.FC = () => {
  const { user, loading, login, logout, refreshUser, error: authError } = useUser();
  const { createTask, updateTask } = useTaskManager();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

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
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only video files are supported');
      return;
    }
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please upload a smaller file.`);
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
  const uploadFile = async (file: File) => {
    try {
      // Create a task for this upload
      const taskId = await createTask(file.name, file.size);
      
      // Start uploading
      updateTask(taskId, { status: 'uploading' });
        // Use Azure Functions for ultra-fast upload
      const result = await AzureUploadService.uploadFile(file, (progress) => {
        // Update task with progress info that matches existing UI
        updateTask(taskId, {
          progress: progress.progress,
          bytesUploaded: progress.bytesUploaded,
          speed: progress.speed,
          estimatedTimeRemaining: progress.eta,
          status: progress.status === 'completed' ? 'completed' : 
                 progress.status === 'processing' ? 'processing' : 'uploading'
        });
      });      // If Azure Functions provided metadata, store it as fallback
      if (result.metadata) {
        try {
          const tokenData = await AzureUploadService.getUploadToken();
          await AzureUploadService.storeVideoMetadata(result.metadata, tokenData.token);
          console.log('✅ Metadata stored via fallback method');
        } catch (metadataError) {
          console.error('❌ Failed to store metadata via fallback:', metadataError);
          // Continue anyway - upload was successful
        }
      }// Upload completed successfully
      updateTask(taskId, { 
        status: 'completed',
        progress: 100 
      });
      
      // Refresh user data to update quota information
      refreshUser().catch(err => console.error('Failed to refresh user data:', err));
      
      // Redirect to video view page instead of opening download
      setTimeout(() => {
        window.location.href = result.shareLink; // Use location.href to navigate to the video view page
      }, 1000);} catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(`Upload failed: ${errorMessage}`);
      
      // Update task status to error if it exists
      const existingTasks = Object.keys(localStorage).filter(key => key.startsWith('task_'));
      if (existingTasks.length > 0) {
        const latestTaskKey = existingTasks[existingTasks.length - 1];
        const taskId = latestTaskKey.replace('task_', '');
        updateTask(taskId, { 
          status: 'error',
          error: errorMessage
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleMyClipsClick = () => {
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
      </div>      {/* User Auth - Simple addition */}
      <div className="auth-section">
        {loading ? (
          <div className="auth-loading">Loading...</div>
        ) : user ? (
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
                    style={{ width: `${Math.min((user.uploadStats?.quotaPercentUsed || 0) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="quota-text">
                  {((user.uploadStats?.totalSize || 0) / (1024 * 1024 * 1024)).toFixed(1)}GB/5GB
                </span>
              </div>
            </div>
            <div className="user-actions-mini">
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
              <div className="info-desc">Up to 300MB per file</div>
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
      </div>

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
      )}
      
      <div className="footer">
        VillainArc © 2025 • Secure Clip Sharing
      </div>
    </div>
  );
};

export default ClipUploader;
