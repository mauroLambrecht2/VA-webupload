import React, { useState, useEffect } from 'react';
import './VideoPreview.css';

interface VideoPreviewProps {
  videoId: string;
  originalName: string;
  size: number;
  className?: string;
  showThumbnail?: boolean;
  showMetadata?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoId,
  originalName,
  size,
  className = '',
  showThumbnail = true,
  showMetadata = true
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://va-expressupload.onrender.com'
    : 'http://localhost:8000';

  useEffect(() => {
    if (showThumbnail) {
      generateThumbnail();
    }
  }, [videoId, showThumbnail]);

  const generateThumbnail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/thumbnail/${videoId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setThumbnailUrl(url);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getVideoIcon = () => {
    const ext = getFileExtension(originalName);
    switch (ext) {
      case 'mp4':
        return '🎬';
      case 'avi':
        return '🎞️';
      case 'mov':
        return '📹';
      case 'wmv':
        return '🎥';
      case 'mkv':
        return '🎪';
      default:
        return '📺';
    }
  };

  return (
    <div className={`video-preview ${className}`}>
      {showThumbnail && (
        <div className="video-thumbnail">
          {loading ? (
            <div className="thumbnail-loading">
              <div className="spinner"></div>
            </div>
          ) : thumbnailUrl && !error ? (
            <img 
              src={thumbnailUrl} 
              alt={`Thumbnail for ${originalName}`}
              className="thumbnail-image"
            />
          ) : (
            <div className="thumbnail-placeholder">
              <span className="video-icon">{getVideoIcon()}</span>
              <span className="file-extension">{getFileExtension(originalName).toUpperCase()}</span>
            </div>
          )}
          
          <div className="video-overlay">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="play-icon">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      
      {showMetadata && (
        <div className="video-metadata">
          <div className="video-name" title={originalName}>
            {originalName}
          </div>
          <div className="video-details">
            <span className="file-size">{formatFileSize(size)}</span>
            <span className="file-type">{getFileExtension(originalName).toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
