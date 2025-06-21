import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const AuthButton: React.FC = () => {
  const { user, loading, login, logout } = useUser();
  const [showDashboard, setShowDashboard] = useState(false);

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

  if (loading) {
    return (
      <div className="auth-section">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-section">
        <div className="user-section">
          <button 
            className="dashboard-btn"
            onClick={() => setShowDashboard(!showDashboard)}
            title="View dashboard"
          >
            📊
          </button>
          
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img 
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=40`}
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
              <div className="username">
                {user.username}#{user.discriminator}
              </div>
              <div className="quota-info">
                <div className="quota-bar">
                  <div 
                    className="quota-fill" 
                    style={{ 
                      width: `${Math.min(user.uploadStats.quotaPercentUsed, 100)}%`,
                      backgroundColor: getQuotaColor(user.uploadStats.quotaPercentUsed)
                    }}
                  />
                </div>
                <div className="quota-text">
                  {formatBytes(user.uploadStats.totalSize)} / {formatBytes(user.uploadStats.quota)}
                  <span className="quota-percent">
                    ({user.uploadStats.quotaPercentUsed.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className="logout-btn"
            onClick={logout}
            title="Logout"
          >
            Logout
          </button>
        </div>

        {/* Dashboard Panel */}
        {showDashboard && (
          <>
            <div className="dashboard-overlay" onClick={() => setShowDashboard(false)} />
            <div className="dashboard-panel">
              <div className="dashboard-header">
                <h3>Your Dashboard</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowDashboard(false)}
                >
                  ×
                </button>
              </div>
              <div className="dashboard-content">
                <div className="quota-section">
                  <h4>Storage Quota</h4>
                  <div className="quota-visual">
                    <div className="quota-bar-large">
                      <div 
                        className="quota-fill-large" 
                        style={{ 
                          width: `${Math.min(user.uploadStats.quotaPercentUsed, 100)}%`,
                          backgroundColor: getQuotaColor(user.uploadStats.quotaPercentUsed)
                        }}
                      />
                    </div>
                    <div className="quota-info-detailed">
                      <span className="quota-used">
                        {formatBytes(user.uploadStats.totalSize)} used
                      </span>
                      <span className="quota-total">
                        of {formatBytes(user.uploadStats.quota)} 
                        ({user.uploadStats.quotaPercentUsed.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="quota-remaining">
                      {formatBytes(user.uploadStats.remainingQuota)} remaining
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stat-item">
                    <span className="stat-number">{user.uploadStats.uploadCount}</span>
                    <span className="stat-label">Videos Uploaded</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{formatBytes(user.uploadStats.totalSize)}</span>
                    <span className="stat-label">Total Size</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="auth-section">
      <button 
        className="login-btn"
        onClick={login}
      >
        Login with Discord
      </button>
    </div>
  );
};

export default AuthButton;
