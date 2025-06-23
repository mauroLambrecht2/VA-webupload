import React, { useState } from 'react';
import './CopyLinkButton.css';

interface CopyLinkButtonProps {
  text: string;
  label?: string;
  className?: string;
}

const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ 
  text, 
  label = 'Copy Link',
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      
      document.body.removeChild(textArea);
    }
  };

  return (
    <button 
      className={`copy-link-btn ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ${label}`}
    >
      <span className="copy-icon">
        {copied ? '✅' : '📋'}
      </span>
      <span className="copy-text">
        {copied ? 'Copied!' : label}
      </span>
    </button>
  );
};

export default CopyLinkButton;
