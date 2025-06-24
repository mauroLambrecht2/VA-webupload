import React, { useState, useEffect } from 'react';
import AzureUploadService from '../services/AzureUploadService';
import './UserQuota.css';

interface QuotaStats {
  quota: number;
  totalUploadSize: number;
  remainingQuota: number;
  uploadCount: number;
  usagePercentage: number;
  quotaFormatted: {
    total: string;
    used: string;
    remaining: string;
  };
}

interface UserQuotaProps {
  onRefresh?: () => void;
  compact?: boolean;
}

const UserQuota: React.FC<UserQuotaProps> = ({ onRefresh, compact = false }) => {
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotaStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const quotaStats = await AzureUploadService.getUserQuotaStats();
      setStats(quotaStats);
    } catch (err) {
      console.error('Failed to load quota stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotaStats();
  }, []);

  const handleRefresh = () => {
    loadQuotaStats();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className={`user-quota ${compact ? 'compact' : ''}`}>
        <div className="quota-loading">Loading quota...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`user-quota ${compact ? 'compact' : ''}`}>
        <div className="quota-error">
          <span>Failed to load quota</span>
          <button onClick={handleRefresh} className="refresh-btn">↻</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#ff4757';
    if (percentage >= 75) return '#ffa502';
    if (percentage >= 50) return '#f39c12';
    return '#2ed573';
  };

  return (
    <div className={`user-quota ${compact ? 'compact' : ''}`}>
      <div className="quota-header">
        <h3>Storage Quota</h3>
        <button onClick={handleRefresh} className="refresh-btn" title="Refresh quota">
          ↻
        </button>
      </div>
      
      <div className="quota-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(stats.usagePercentage, 100)}%`,
              backgroundColor: getUsageColor(stats.usagePercentage)
            }}
          />
        </div>
        <div className="progress-text">
          {stats.usagePercentage}% used
        </div>
      </div>

      <div className="quota-details">
        <div className="quota-row">
          <span className="label">Used:</span>
          <span className="value">{stats.quotaFormatted.used}</span>
        </div>
        <div className="quota-row">
          <span className="label">Remaining:</span>
          <span className="value">{stats.quotaFormatted.remaining}</span>
        </div>
        <div className="quota-row">
          <span className="label">Total:</span>
          <span className="value">{stats.quotaFormatted.total}</span>
        </div>
        <div className="quota-row">
          <span className="label">Videos:</span>
          <span className="value">{stats.uploadCount}</span>
        </div>
      </div>

      {stats.usagePercentage >= 90 && (
        <div className="quota-warning">
          ⚠️ You're running low on storage space!
        </div>
      )}
    </div>
  );
};

export default UserQuota;
