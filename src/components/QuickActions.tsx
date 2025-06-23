import React, { useState } from 'react';
import './QuickActions.css';

interface QuickActionsProps {
  videoId: string;
  videoName: string;
  shareLink: string;
  downloadLink: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  videoId,
  videoName,
  shareLink,
  downloadLink
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Video: ${videoName}`,
          text: `Check out this video: ${videoName}`,
          url: shareLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        handleCopyLink(); // Fallback to copy
      }
    } else {
      handleCopyLink(); // Fallback for browsers without Web Share API
    }
  };

  return (
    <div className="quick-actions">
      {/* View Video */}
      <a
        href={shareLink}
        target="_blank"
        rel="noopener noreferrer"
        className="quick-action-btn view-btn"
        title="View video"
        onMouseEnter={() => setShowTooltip('view')}
        onMouseLeave={() => setShowTooltip(null)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
        {showTooltip === 'view' && <span className="tooltip">View</span>}
      </a>

      {/* Share/Copy Link */}
      <button
        onClick={handleShare}
        className={`quick-action-btn share-btn ${copied ? 'copied' : ''}`}
        title={copied ? 'Copied!' : 'Share video'}
        onMouseEnter={() => setShowTooltip('share')}
        onMouseLeave={() => setShowTooltip(null)}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        )}
        {showTooltip === 'share' && <span className="tooltip">{copied ? 'Copied!' : 'Share'}</span>}
      </button>

      {/* Download */}
      <a
        href={downloadLink}
        className="quick-action-btn download-btn"
        title="Download video"
        onMouseEnter={() => setShowTooltip('download')}
        onMouseLeave={() => setShowTooltip(null)}
      >        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        {showTooltip === 'download' && <span className="tooltip">Download</span>}
      </a>
    </div>
  );
};

export default QuickActions;
