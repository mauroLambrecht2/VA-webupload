import React, { useState } from 'react';
import './BulkActions.css';

interface ClipData {
  id: string;
  originalName: string;
  size: number;
  uploadDate: string;
  shareLink: string;
  downloadUrl: string;
}

interface BulkActionsProps {
  clips: ClipData[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDownload: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  canDelete?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  clips,
  selectedIds,
  onSelectionChange,
  onBulkDownload,
  onBulkDelete,
  canDelete = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = () => {
    if (selectedIds.length === clips.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(clips.map(clip => clip.id));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkDownload(selectedIds);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !onBulkDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} video(s)? This action cannot be undone.`
    );
    
    if (confirmed) {
      setIsProcessing(true);
      try {
        await onBulkDelete(selectedIds);
        onSelectionChange([]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getTotalSize = () => {
    const selectedClips = clips.filter(clip => selectedIds.includes(clip.id));
    const totalBytes = selectedClips.reduce((sum, clip) => sum + clip.size, 0);
    return formatFileSize(totalBytes);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (clips.length === 0) return null;

  return (
    <div className="bulk-actions">
      <div className="bulk-selection">
        <label className="select-all">
          <input
            type="checkbox"
            checked={selectedIds.length === clips.length && clips.length > 0}
            onChange={handleSelectAll}
          />
          <span className="checkmark"></span>
          Select All ({clips.length})
        </label>
        
        {selectedIds.length > 0 && (
          <div className="selection-info">
            {selectedIds.length} selected • {getTotalSize()}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-buttons">
          <button
            className="bulk-btn download-btn"
            onClick={handleBulkDownload}
            disabled={isProcessing}
          >
            <span className="btn-icon">📥</span>
            Download Selected {isProcessing && '(Processing...)'}
          </button>
          
          {canDelete && onBulkDelete && (
            <button
              className="bulk-btn delete-btn"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              <span className="btn-icon">🗑️</span>
              Delete Selected
            </button>
          )}
          
          <button
            className="bulk-btn clear-btn"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
