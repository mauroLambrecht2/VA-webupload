import React, { useEffect, useState } from 'react';
import './KeyboardShortcuts.css';

interface KeyboardShortcutsProps {
  onToggleBulkMode?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onRefresh?: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onToggleBulkMode,
  onSelectAll,
  onClearSelection,
  onRefresh
}) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle shortcuts with modifier keys to avoid conflicts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            onToggleBulkMode?.();
            break;
          case 'a':
            event.preventDefault();
            onSelectAll?.();
            break;
          case 'r':
            event.preventDefault();
            onRefresh?.();
            break;
        }
      }

      // Special keys without modifiers
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key) {
          case 'Escape':
            if (showHelp) {
              setShowHelp(false);
            } else {
              onClearSelection?.();
            }
            break;
          case '?':
            event.preventDefault();
            setShowHelp(!showHelp);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleBulkMode, onSelectAll, onClearSelection, onRefresh, showHelp]);

  return (
    <>
      {/* Help trigger button */}
      <button
        className="keyboard-help-trigger"
        onClick={() => setShowHelp(true)}
        title="Keyboard shortcuts (Press ? for help)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.5 2C6.8 2 3 5.8 3 10.5s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5S16.2 2 11.5 2m0 16c-4.1 0-7.5-3.4-7.5-7.5S7.4 3 11.5 3s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5m.5-6h-1v-1.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 .8-.4 1.5-1 1.9l-.5.4c-.3.2-.5.5-.5.9V12m-1 2.25h1V16h-1v-1.75z"/>
        </svg>
      </button>

      {/* Help modal */}
      {showHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowHelp(false)}>
          <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="keyboard-help-header">
              <h3>Keyboard Shortcuts</h3>
              <button
                className="close-btn"
                onClick={() => setShowHelp(false)}
              >
                ×
              </button>
            </div>
            
            <div className="keyboard-help-content">
              <div className="shortcut-group">
                <h4>Navigation</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>?</kbd>
                    <span>Show/hide this help</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>Clear selection or close modal</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-group">
                <h4>Bulk Actions</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>B</kbd>
                    <span>Toggle bulk selection mode</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>A</kbd>
                    <span>Select all videos</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-group">
                <h4>General</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>R</kbd>
                    <span>Refresh video list</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-tip">
                <strong>Tip:</strong> These shortcuts work when you're not typing in a text field.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts;
