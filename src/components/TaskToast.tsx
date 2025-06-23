import React, { useState, useEffect } from 'react';
import './TaskToast.css';

export interface UploadTask {
  id: string;
  filename: string;
  fileSize: number;
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  bytesUploaded: number;
  speed: number;
  estimatedTimeRemaining: number;
  startTime: number;
  error?: string;
}

interface TaskToastProps {
  task: UploadTask;
  onRemove: (taskId: string) => void;
  onRetry?: (taskId: string) => void;
}

const TaskToast: React.FC<TaskToastProps> = ({ task, onRemove, onRetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0 || !isFinite(seconds)) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  const getStatusIcon = () => {
    switch (task.status) {
      case 'preparing':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📁';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'preparing':
        return '#ffa500';
      case 'uploading':
        return '#5865f2';
      case 'processing':
        return '#00bcd4';
      case 'completed':
        return '#00d26a';
      case 'error':
        return '#ff6b6b';
      default:
        return '#ffffff';
    }
  };

  // Auto-remove completed tasks after 5 seconds
  useEffect(() => {
    if (task.status === 'completed') {
      const timer = setTimeout(() => {
        onRemove(task.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [task.status, task.id, onRemove]);

  return (
    <div className={`task-toast ${task.status}`}>
      <div className="task-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="task-info">
          <span className="task-icon">{getStatusIcon()}</span>
          <div className="task-details">
            <div className="task-filename">{task.filename}</div>            <div className="task-status-text">
              {task.status === 'preparing' && 'Preparing upload...'}
              {task.status === 'uploading' && `${task.progress}% • ${formatSpeed(task.speed)}`}
              {task.status === 'processing' && 'Processing on server...'}
              {task.status === 'completed' && 'Upload complete!'}
              {task.status === 'error' && 'Upload failed'}
            </div>
          </div>
        </div>
        
        <div className="task-actions">
          {task.status === 'error' && onRetry && (
            <button className="retry-btn" onClick={(e) => { e.stopPropagation(); onRetry(task.id); }}>
              🔄
            </button>
          )}
          <button className="close-btn" onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}>
            ✕
          </button>
        </div>
      </div>      {/* Progress Bar */}
      {(task.status === 'uploading' || task.status === 'preparing' || task.status === 'processing') && (
        <div className="progress-bar">
          <div 
            className={`progress-fill ${task.status === 'processing' ? 'processing-animation' : ''}`}
            style={{ 
              width: task.status === 'processing' ? '95%' : `${task.progress}%`,
              backgroundColor: getStatusColor()
            }}
          />
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="task-expanded">
          <div className="task-stat">
            <span className="stat-label">Size:</span>
            <span className="stat-value">{formatFileSize(task.fileSize)}</span>
          </div>
          
          {task.status === 'uploading' && (
            <>
              <div className="task-stat">
                <span className="stat-label">Uploaded:</span>
                <span className="stat-value">
                  {formatFileSize(task.bytesUploaded)} / {formatFileSize(task.fileSize)}
                </span>
              </div>
              
              <div className="task-stat">
                <span className="stat-label">Speed:</span>
                <span className="stat-value">{formatSpeed(task.speed)}</span>
              </div>
              
              <div className="task-stat">
                <span className="stat-label">Time remaining:</span>
                <span className="stat-value">{formatTime(task.estimatedTimeRemaining)}</span>
              </div>
            </>
          )}
          
          {task.status === 'completed' && (
            <div className="task-stat">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">
                {formatTime((Date.now() - task.startTime) / 1000)}
              </span>
            </div>
          )}
          
          {task.status === 'error' && task.error && (
            <div className="task-error">
              <span className="error-label">Error:</span>
              <span className="error-message">{task.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskToast;
