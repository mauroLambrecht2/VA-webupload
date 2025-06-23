import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CopyLinkButton from './CopyLinkButton';
import QuickActions from './QuickActions';
import KeyboardShortcuts from './KeyboardShortcuts';
import NotificationToast, { NotificationData } from './NotificationToast';
import './ClipsPage.css';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://va-expressupload.onrender.com'
  : 'http://localhost:8000';

interface ClipData {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  uploadDate: string;
  shareLink: string;
  downloadUrl: string;
  uploadedBy: {
    id: string;
    username: string;
    avatar: string;
  };
}

const ClipsPage: React.FC = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();  const [clips, setClips] = useState<ClipData[]>([]);
  const [showMyClipsOnly, setShowMyClipsOnly] = useState(true);
  const [loadingClips, setLoadingClips] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Notification helper
  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
    };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);  // Fetch clips when component mounts
  useEffect(() => {
    fetchClips();
  }, [user]);
  const fetchClips = async () => {
    try {
      setLoadingClips(true);
      setError(''); // Clear any previous errors
      
      console.log('Fetching clips...'); // Debug log
      
      const response = await fetch(`${API_BASE_URL}/api/clips/all`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clips');
      }

      const data = await response.json();
      setClips(data.clips || []);
      
      console.log('Clips fetched successfully:', data.clips?.length || 0); // Debug log
      
    } catch (err) {
      console.error('Error fetching clips:', err);
      setError('Failed to load clips');
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load clips'
      });
    } finally {
      setLoadingClips(false);
    }  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered'); // Debug log
    addNotification({
      type: 'info',
      title: 'Refreshing',
      message: 'Updating clips list...'
    });
    fetchClips();
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Get current clips based on filter
  const currentClips = showMyClipsOnly && user ? 
    clips.filter(clip => clip.uploadedBy.username === user.username) : 
    clips;

  // Group clips by user when showing all clips
  const groupedClips = showMyClipsOnly ? 
    null : 
    currentClips.reduce((groups: { [key: string]: ClipData[] }, clip) => {
      const username = clip.uploadedBy.username;
      if (!groups[username]) {
        groups[username] = [];
      }
      groups[username].push(clip);
      return groups;
    }, {});

  if (loading || loadingClips) {
    return (
      <div className="clips-page">
        <div className="clips-loading">
          <div className="loading-spinner"></div>
          <p>Loading clips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clips-page">
      {/* Header */}
      <header className="clips-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Upload
          </button>
          
          <h1>VillainArc Clips</h1>
          
          {user && (
            <div className="user-info">
              <img src={user.avatar} alt="Avatar" className="user-avatar" />
              <span>{user.username}</span>
            </div>
          )}
        </div>      </header>

      {/* Search and Filter Section */}
      <div className="filter-section">
        <div className="filter-content">
          <div className="filter-header">            <div className="filter-toggle">
              <button 
                className={`filter-btn ${showMyClipsOnly ? 'active' : ''}`}
                onClick={() => setShowMyClipsOnly(true)}
              >
                My Clips ({clips.filter(c => c.uploadedBy.username === user?.username).length})
              </button>
              <button 
                className={`filter-btn ${!showMyClipsOnly ? 'active' : ''}`}
                onClick={() => setShowMyClipsOnly(false)}
              >
                All Clips ({clips.length})
              </button>
            </div>
            
            <div className="filter-actions">
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh clips list (Ctrl+R)"
                disabled={loadingClips}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                {loadingClips ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>      </div>

      {/* Clips Content */}
      <div className="clips-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}        {currentClips.length === 0 && !error ? (
          <div className="no-clips">
            <div className="no-clips-icon">🎬</div>
            <h3>No clips found</h3>
            <p>{showMyClipsOnly ? "You haven't uploaded any clips yet." : "No clips have been uploaded by anyone yet."}</p>
            <button className="upload-btn" onClick={() => navigate('/')}>
              Upload Your First Clip
            </button>
          </div>
        ) : showMyClipsOnly ? (
          <div className="clips-grid">            {currentClips.map((clip) => (
              <div key={clip.id} className="clip-card">
                <div className="clip-info">
                  <h3 className="clip-name">{clip.originalName}</h3>
                  <div className="clip-meta">
                    <span className="clip-size">{formatFileSize(clip.size)}</span>
                    <span className="clip-date">{formatDate(clip.uploadDate)}</span>
                  </div>
                </div>
                <QuickActions
                  videoId={clip.id}
                  videoName={clip.originalName}
                  shareLink={clip.shareLink}
                  downloadLink={`${API_BASE_URL}/download/${clip.id}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="clips-by-user">
            {Object.entries(groupedClips || {}).map(([username, userClips]) => (
              <div key={username} className="user-section">
                <div className="user-header">
                  <img 
                    src={userClips[0]?.uploadedBy.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                    alt="Avatar" 
                    className="user-avatar-small" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                    }}
                  />
                  <h3>{username}</h3>
                  <span className="clip-count">({userClips.length} clips)</span>
                </div>
                <div className="user-clips">                  {userClips.map((clip) => (
                    <div key={clip.id} className="clip-row">
                      <div className="clip-info">
                        <span className="clip-name">{clip.originalName}</span>
                        <div className="clip-meta">
                          <span className="clip-size">{formatFileSize(clip.size)}</span>
                          <span className="clip-date">{formatDate(clip.uploadDate)}</span>
                        </div>
                      </div>
                      <QuickActions
                        videoId={clip.id}
                        videoName={clip.originalName}
                        shareLink={clip.shareLink}
                        downloadLink={`${API_BASE_URL}/download/${clip.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onRefresh={handleRefresh}
      />
      
      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default ClipsPage;
