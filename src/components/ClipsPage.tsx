import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
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
  const navigate = useNavigate();
  const [clips, setClips] = useState<ClipData[]>([]);
  const [filteredClips, setFilteredClips] = useState<ClipData[]>([]);
  const [showMyClipsOnly, setShowMyClipsOnly] = useState(true);
  const [loadingClips, setLoadingClips] = useState(true);
  const [error, setError] = useState('');

  // Fetch clips when component mounts
  useEffect(() => {
    fetchClips();
  }, []);
  // Filter clips when filter changes
  useEffect(() => {
    if (showMyClipsOnly && user) {
      setFilteredClips(clips.filter(clip => clip.uploadedBy.username === user.username));
    } else {
      setFilteredClips(clips);
    }
  }, [clips, showMyClipsOnly, user]);
  const fetchClips = async () => {
    try {
      setLoadingClips(true);
      const response = await fetch(`${API_BASE_URL}/api/clips/all`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clips');
      }

      const data = await response.json();
      setClips(data.clips || []);
    } catch (err) {
      console.error('Error fetching clips:', err);
      setError('Failed to load clips');
    } finally {
      setLoadingClips(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
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
  // Group clips by user when showing all clips
  const groupedClips = showMyClipsOnly ? 
    null : 
    filteredClips.reduce((groups: { [key: string]: ClipData[] }, clip) => {
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
        </div>
      </header>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-content">
          <div className="filter-toggle">            <button 
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
        </div>
      </div>

      {/* Clips Content */}
      <div className="clips-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {filteredClips.length === 0 && !error ? (
          <div className="no-clips">
            <div className="no-clips-icon">🎬</div>
            <h3>No clips found</h3>
            <p>{showMyClipsOnly ? "You haven't uploaded any clips yet." : "No clips have been uploaded by anyone yet."}</p>
            <button className="upload-btn" onClick={() => navigate('/')}>
              Upload Your First Clip
            </button>
          </div>
        ) : showMyClipsOnly ? (
          <div className="clips-grid">
            {filteredClips.map((clip) => (
              <div key={clip.id} className="clip-card">
                <div className="clip-info">
                  <h3 className="clip-name">{clip.originalName}</h3>
                  <div className="clip-meta">
                    <span className="clip-size">{formatFileSize(clip.size)}</span>
                    <span className="clip-date">{formatDate(clip.uploadDate)}</span>
                  </div>
                </div>
                <div className="clip-actions">
                  <a 
                    href={`${API_BASE_URL}/v/${clip.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn view-btn"
                  >
                    View
                  </a>
                  <a 
                    href={`${API_BASE_URL}/download/${clip.id}`} 
                    className="action-btn download-btn"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="clips-by-user">
            {Object.entries(groupedClips || {}).map(([username, userClips]) => (
              <div key={username} className="user-section">                <div className="user-header">
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
                <div className="user-clips">
                  {userClips.map((clip) => (
                    <div key={clip.id} className="clip-row">
                      <div className="clip-info">
                        <span className="clip-name">{clip.originalName}</span>
                        <div className="clip-meta">
                          <span className="clip-size">{formatFileSize(clip.size)}</span>
                          <span className="clip-date">{formatDate(clip.uploadDate)}</span>
                        </div>
                      </div>
                      <div className="clip-actions">
                        <a 
                          href={`${API_BASE_URL}/v/${clip.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn view-btn"
                        >
                          View
                        </a>
                        <a 
                          href={`${API_BASE_URL}/download/${clip.id}`} 
                          className="action-btn download-btn"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipsPage;
