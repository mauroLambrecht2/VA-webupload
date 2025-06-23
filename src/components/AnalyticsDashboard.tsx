import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

interface AnalyticsData {
  overview: {
    totalVideos: number;
    totalViews: number;
    totalDownloads: number;
    totalStorage: number;
    uniqueViewers: number;
    averageViewsPerVideo: number;
  };
  trends: {
    date: string;
    views: number;
    downloads: number;
    uploads: number;
  }[];
  topVideos: {
    id: string;
    name: string;
    views: number;
    downloads: number;
    shares: number;
    uploadDate: string;
  }[];
  userStats: {
    totalUsers: number;
    activeUsers: number;
    topUploaders: {
      username: string;
      uploads: number;
      totalViews: number;
    }[];
  };
}

interface AnalyticsDashboardProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = '',
  isOpen,
  onClose
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://va-expressupload.onrender.com'
    : 'http://localhost:8000';

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard?range=${timeRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`analytics-dashboard-overlay ${className}`}>
      <div className="analytics-dashboard">
        <div className="dashboard-header">
          <h2>Analytics Dashboard</h2>
          
          <div className="header-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="time-range-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button onClick={onClose} className="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <p>Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="dashboard-error">
              <p>{error}</p>
              <button onClick={fetchAnalytics} className="retry-btn">
                Retry
              </button>
            </div>
          ) : analytics ? (
            <div className="analytics-grid">
              {/* Overview Cards */}
              <div className="overview-section">
                <h3>Overview</h3>
                <div className="overview-cards">
                  <div className="metric-card">
                    <div className="metric-icon">🎬</div>
                    <div className="metric-content">
                      <div className="metric-value">{formatNumber(analytics.overview.totalVideos)}</div>
                      <div className="metric-label">Total Videos</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">👁️</div>
                    <div className="metric-content">
                      <div className="metric-value">{formatNumber(analytics.overview.totalViews)}</div>
                      <div className="metric-label">Total Views</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">⬇️</div>
                    <div className="metric-content">
                      <div className="metric-value">{formatNumber(analytics.overview.totalDownloads)}</div>
                      <div className="metric-label">Downloads</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">💾</div>
                    <div className="metric-content">
                      <div className="metric-value">{formatFileSize(analytics.overview.totalStorage)}</div>
                      <div className="metric-label">Storage Used</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">👥</div>
                    <div className="metric-content">
                      <div className="metric-value">{formatNumber(analytics.overview.uniqueViewers)}</div>
                      <div className="metric-label">Unique Viewers</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                      <div className="metric-value">{analytics.overview.averageViewsPerVideo.toFixed(1)}</div>
                      <div className="metric-label">Avg Views/Video</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trends Chart */}
              <div className="trends-section">
                <h3>Activity Trends</h3>
                <div className="chart-container">
                  <div className="chart">
                    {analytics.trends.map((point, index) => (
                      <div key={point.date} className="chart-bar">
                        <div 
                          className="bar views" 
                          style={{ 
                            height: `${(point.views / Math.max(...analytics.trends.map(t => t.views))) * 100}%` 
                          }}
                          title={`${point.views} views`}
                        />
                        <div 
                          className="bar downloads" 
                          style={{ 
                            height: `${(point.downloads / Math.max(...analytics.trends.map(t => t.downloads))) * 100}%` 
                          }}
                          title={`${point.downloads} downloads`}
                        />
                        <div 
                          className="bar uploads" 
                          style={{ 
                            height: `${(point.uploads / Math.max(...analytics.trends.map(t => t.uploads))) * 100}%` 
                          }}
                          title={`${point.uploads} uploads`}
                        />
                        <div className="chart-label">{formatDate(point.date)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color views"></div>
                      <span>Views</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color downloads"></div>
                      <span>Downloads</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color uploads"></div>
                      <span>Uploads</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Videos */}
              <div className="top-videos-section">
                <h3>Top Performing Videos</h3>
                <div className="top-videos-list">
                  {analytics.topVideos.map((video, index) => (
                    <div key={video.id} className="top-video-item">
                      <div className="video-rank">#{index + 1}</div>
                      <div className="video-info">
                        <div className="video-name">{video.name}</div>
                        <div className="video-date">{formatDate(video.uploadDate)}</div>
                      </div>
                      <div className="video-stats">
                        <div className="stat">
                          <span className="stat-value">{formatNumber(video.views)}</span>
                          <span className="stat-label">views</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{formatNumber(video.downloads)}</span>
                          <span className="stat-label">downloads</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{formatNumber(video.shares)}</span>
                          <span className="stat-label">shares</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Statistics */}
              <div className="user-stats-section">
                <h3>User Statistics</h3>
                <div className="user-stats-content">
                  <div className="user-overview">
                    <div className="user-stat">
                      <div className="user-stat-value">{formatNumber(analytics.userStats.totalUsers)}</div>
                      <div className="user-stat-label">Total Users</div>
                    </div>
                    <div className="user-stat">
                      <div className="user-stat-value">{formatNumber(analytics.userStats.activeUsers)}</div>
                      <div className="user-stat-label">Active Users</div>
                    </div>
                  </div>
                  
                  <div className="top-uploaders">
                    <h4>Top Uploaders</h4>
                    <div className="uploaders-list">
                      {analytics.userStats.topUploaders.map((uploader, index) => (
                        <div key={uploader.username} className="uploader-item">
                          <div className="uploader-rank">#{index + 1}</div>
                          <div className="uploader-name">{uploader.username}</div>
                          <div className="uploader-stats">
                            <span>{uploader.uploads} uploads</span>
                            <span>{formatNumber(uploader.totalViews)} views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
