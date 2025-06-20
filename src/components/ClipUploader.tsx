import React, { useRef, useState } from 'react';
import './ClipUploaderFinal.css';

// API Configuration - Clean URLs for production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Same origin in production (no port needed)
  : 'http://localhost:8000'; // Backend URL for development

const MAX_SIZE_MB = 100;
const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
  'video/x-matroska', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'
];

const ClipUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
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
    setResult(null);
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only video files are supported');
      return;
    }
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit`);
      return;
    }
    
    uploadFile(file);
  };

  const uploadFile = (file: File) => {
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('video', file);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });    }, 200);
    
    fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    })
    .then(async (res) => {
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Upload failed');
      }
      return res.json();
    })
    .then((data) => {
      setResult(data);
    })
    .catch((err) => {
      const errorMsg = err.message || 'Upload failed. Please try again.';
      setError(errorMsg);
    })
    .finally(() => {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };  return (
    <div 
      className="clip-uploader"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {/* Drag Overlay - Clean and Subtle */}
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
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      
      <div className="content">        <div className="main-section">
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
              <div className="info-desc">Up to {MAX_SIZE_MB}MB per file</div>
            </div>
            <div className="info-item">
              <div className="info-title">Auto Sharing</div>
              <div className="info-desc">Discord notification on upload</div>
            </div>
          </div>
          
          <div className="upload-action">
            <div className="upload-prompt">Drop your video file or click to browse</div>
            <div className="upload-hint">Files are automatically shared with unique secure links</div>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">Uploading... {Math.round(progress)}%</div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <div className="error-message">
            {error}
          </div>
        </div>
      )}

      {result && (
        <div className="result-container">
          <video 
            src={result.previewUrl} 
            controls 
            className="video-preview"
          />
          
          <div className="result-actions">
            <a 
              href={result.previewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
            >
              View Clip
            </a>
            <a 
              href={result.downloadUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
            >
              Download
            </a>
          </div>
          
          <div className="result-id">
            Clip ID: {result.id}
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
