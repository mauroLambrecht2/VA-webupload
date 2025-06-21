import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, loading, login, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQuotaColor = (percentUsed: number): string => {
    if (percentUsed >= 90) return '#ff6b6b';
    if (percentUsed >= 75) return '#ffa726';
    return '#4dabf7';
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="app-title">
            <span className="villain-arc">VillainArc</span>
            <span className="clip-share">Clips</span>
          </Link>
          
          <nav className="header-nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Upload
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        
        <div className="header-right">
          {loading ? (
            <div className="auth-loading">
              <div className="loading-spinner"></div>
              <span>Loading...</span>
            </div>
          ) : user ? (
            <div className="user-section" ref={menuRef}>
              <div className="user-info">
                <div className="user-stats">
                  <div className="quota-mini">
                    <div className="quota-text">
                      {formatBytes(user.uploadStats.totalSize)} / {formatBytes(user.uploadStats.quota)}
                    </div>
                    <div className="quota-bar-mini">
                      <div 
                        className="quota-fill-mini" 
                        style={{ 
                          width: `${Math.min(user.uploadStats.quotaPercentUsed, 100)}%`,
                          backgroundColor: getQuotaColor(user.uploadStats.quotaPercentUsed)
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div 
                  className="user-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                        alt={`${user.username}'s avatar`}
                        className="avatar-img"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="username">{user.username}</div>
                    <div className="user-id">#{user.discriminator}</div>
                  </div>
                  <div className="menu-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                      <path d="M6 8L0 0h12L6 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {showUserMenu && (
                <div className="user-menu">
                  <div className="menu-header">
                    <div className="menu-user-info">
                      <span className="menu-username">{user.username}#{user.discriminator}</span>
                      <span className="menu-status">
                        {user.verified ? '✅ Verified' : '⚠️ Unverified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="menu-actions">
                    <Link 
                      to="/dashboard" 
                      className="menu-btn dashboard-btn"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                      </svg>
                      Dashboard
                    </Link>
                    
                    <button 
                      className="menu-btn logout-btn"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-section">
              <div className="auth-info">
                <span className="auth-description">Connect with Discord to start uploading</span>
              </div>
              <button 
                className="login-btn"
                onClick={login}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login with Discord
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
