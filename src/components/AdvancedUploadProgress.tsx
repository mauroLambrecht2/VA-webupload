import React, { useState, useEffect } from 'react';
import './AdvancedUploadProgress.css';

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  speed?: number;
  eta?: number;
  error?: string;
  result?: {
    id: string;
    shareLink: string;
    downloadUrl: string;
  };
}

interface AdvancedUploadProgressProps {
  tasks: UploadTask[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: (id: string) => void;
  className?: string;
}

const AdvancedUploadProgress: React.FC<AdvancedUploadProgressProps> = ({
  tasks,
  onCancel,
  onRetry,
  onClear,
  className = ''
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const getStatusIcon = (status: UploadTask['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'uploading':
        return (
          <div className="spinner-small">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10h-2c0 4.41-3.59 8-8 8s-8-3.59-8-8 3.59-8 8-8z"/>
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="spinner-small">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        );
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        );
    }
  };

  const getStatusColor = (status: UploadTask['status']) => {
    switch (status) {
      case 'pending': return 'var(--warning-color)';
      case 'uploading': return 'var(--info-color)';
      case 'processing': return 'var(--accent-color)';
      case 'completed': return 'var(--success-color)';
      case 'error': return 'var(--error-color)';
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className={`advanced-upload-progress ${className}`}>
      <div className="progress-header">
        <h3>Upload Progress</h3>
        <div className="progress-summary">
          {tasks.filter(t => t.status === 'completed').length} / {tasks.length} completed
        </div>
      </div>

      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className={`task-item ${task.status}`}>
            <div className="task-header" onClick={() => toggleExpanded(task.id)}>
              <div className="task-icon" style={{ color: getStatusColor(task.status) }}>
                {getStatusIcon(task.status)}
              </div>
              
              <div className="task-info">
                <div className="task-name">{task.file.name}</div>
                <div className="task-size">{formatFileSize(task.file.size)}</div>
              </div>
              
              <div className="task-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${task.progress}%`,
                      backgroundColor: getStatusColor(task.status)
                    }}
                  />
                </div>
                <div className="progress-text">{task.progress}%</div>
              </div>
              
              <div className="task-actions">
                {task.status === 'uploading' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(task.id);
                    }}
                    className="action-btn cancel-btn"
                    title="Cancel upload"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                )}
                
                {task.status === 'error' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(task.id);
                    }}
                    className="action-btn retry-btn"
                    title="Retry upload"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  </button>
                )}
                
                {(task.status === 'completed' || task.status === 'error') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear(task.id);
                    }}
                    className="action-btn clear-btn"
                    title="Remove from list"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(task.id);
                  }}
                  className="action-btn expand-btn"
                  title={expandedTasks.has(task.id) ? "Collapse" : "Expand"}
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    style={{ 
                      transform: expandedTasks.has(task.id) ? 'rotate(180deg)' : 'rotate(0deg)' 
                    }}
                  >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {expandedTasks.has(task.id) && (
              <div className="task-details">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{task.status}</span>
                  </div>
                  
                  {task.speed && (
                    <div className="detail-item">
                      <span className="detail-label">Speed:</span>
                      <span className="detail-value">{formatSpeed(task.speed)}</span>
                    </div>
                  )}
                  
                  {task.eta && (
                    <div className="detail-item">
                      <span className="detail-label">Time remaining:</span>
                      <span className="detail-value">{formatTime(task.eta)}</span>
                    </div>
                  )}
                  
                  {task.error && (
                    <div className="detail-item error">
                      <span className="detail-label">Error:</span>
                      <span className="detail-value">{task.error}</span>
                    </div>
                  )}
                  
                  {task.result && (
                    <div className="detail-item success">
                      <span className="detail-label">Share Link:</span>
                      <div className="detail-value">
                        <a 
                          href={task.result.shareLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="share-link"
                        >
                          {task.result.shareLink}
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(task.result!.shareLink)}
                          className="copy-btn"
                          title="Copy link"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedUploadProgress;
