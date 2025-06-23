import React, { useState, useEffect } from 'react';
import './UserSettings.css';

interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  notifications: {
    uploadComplete: boolean;
    downloadStarted: boolean;
    shareActivity: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    showInPublicLists: boolean;
    allowDirectDownloads: boolean;
    requirePasswordForSharing: boolean;
  };
  upload: {
    defaultVisibility: 'public' | 'private' | 'unlisted';
    maxFileSize: number;
    compressionQuality: number;
    generateThumbnails: boolean;
  };
  interface: {
    compactMode: boolean;
    showPreviewOnHover: boolean;
    defaultSortOrder: 'date' | 'name' | 'size' | 'views';
    itemsPerPage: number;
  };
}

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: UserPreferences) => void;
  className?: string;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    notifications: {
      uploadComplete: true,
      downloadStarted: false,
      shareActivity: true,
      weeklyReports: false,
    },
    privacy: {
      showInPublicLists: true,
      allowDirectDownloads: true,
      requirePasswordForSharing: false,
    },
    upload: {
      defaultVisibility: 'public',
      maxFileSize: 500, // MB
      compressionQuality: 80,
      generateThumbnails: true,
    },
    interface: {
      compactMode: false,
      showPreviewOnHover: true,
      defaultSortOrder: 'date',
      itemsPerPage: 20,
    },
  });

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'upload' | 'interface'>('general');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = <T extends keyof UserPreferences>(
    section: T,
    updates: Partial<UserPreferences[T]>
  ) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
      onSave(preferences);
      setHasChanges(false);
      
      // Show success notification
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'success',
          title: 'Settings Saved',
          message: 'Your preferences have been saved successfully',
        },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Show error notification
      const event = new CustomEvent('show-notification', {
        detail: {
          type: 'error',
          title: 'Save Failed',
          message: 'Failed to save your preferences',
        },
      });
      window.dispatchEvent(event);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultPrefs: UserPreferences = {
        theme: 'dark',
        notifications: {
          uploadComplete: true,
          downloadStarted: false,
          shareActivity: true,
          weeklyReports: false,
        },
        privacy: {
          showInPublicLists: true,
          allowDirectDownloads: true,
          requirePasswordForSharing: false,
        },
        upload: {
          defaultVisibility: 'public',
          maxFileSize: 500,
          compressionQuality: 80,
          generateThumbnails: true,
        },
        interface: {
          compactMode: false,
          showPreviewOnHover: true,
          defaultSortOrder: 'date',
          itemsPerPage: 20,
        },
      };
      setPreferences(defaultPrefs);
      setHasChanges(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`user-settings-overlay ${className}`}>
      <div className="user-settings">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              General
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              Notifications
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10 C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1 s3.1,1.39,3.1,3.1V8z"/>
              </svg>
              Privacy
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Upload
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'interface' ? 'active' : ''}`}
              onClick={() => setActiveTab('interface')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z"/>
              </svg>
              Interface
            </button>
          </div>

          <div className="settings-panel">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3>General Settings</h3>
                
                <div className="setting-item">
                  <label>Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => updatePreferences('theme', e.target.value as 'dark' | 'light' | 'auto')}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h3>Notification Preferences</h3>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.uploadComplete}
                      onChange={(e) => updatePreferences('notifications', { uploadComplete: e.target.checked })}
                    />
                    Notify when uploads complete
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.downloadStarted}
                      onChange={(e) => updatePreferences('notifications', { downloadStarted: e.target.checked })}
                    />
                    Notify when downloads start
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.shareActivity}
                      onChange={(e) => updatePreferences('notifications', { shareActivity: e.target.checked })}
                    />
                    Notify about share activity
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.weeklyReports}
                      onChange={(e) => updatePreferences('notifications', { weeklyReports: e.target.checked })}
                    />
                    Send weekly activity reports
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h3>Privacy Settings</h3>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showInPublicLists}
                      onChange={(e) => updatePreferences('privacy', { showInPublicLists: e.target.checked })}
                    />
                    Show my videos in public lists
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.privacy.allowDirectDownloads}
                      onChange={(e) => updatePreferences('privacy', { allowDirectDownloads: e.target.checked })}
                    />
                    Allow direct downloads
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.privacy.requirePasswordForSharing}
                      onChange={(e) => updatePreferences('privacy', { requirePasswordForSharing: e.target.checked })}
                    />
                    Require password for sharing
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="settings-section">
                <h3>Upload Settings</h3>
                
                <div className="setting-item">
                  <label>Default visibility</label>
                  <select
                    value={preferences.upload.defaultVisibility}
                    onChange={(e) => updatePreferences('upload', { defaultVisibility: e.target.value as 'public' | 'private' | 'unlisted' })}
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>Max file size (MB)</label>
                  <input
                    type="number"
                    value={preferences.upload.maxFileSize}
                    onChange={(e) => updatePreferences('upload', { maxFileSize: parseInt(e.target.value) })}
                    min="1"
                    max="2000"
                  />
                </div>
                
                <div className="setting-item">
                  <label>Compression quality (%)</label>
                  <input
                    type="range"
                    value={preferences.upload.compressionQuality}
                    onChange={(e) => updatePreferences('upload', { compressionQuality: parseInt(e.target.value) })}
                    min="10"
                    max="100"
                  />
                  <span>{preferences.upload.compressionQuality}%</span>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.upload.generateThumbnails}
                      onChange={(e) => updatePreferences('upload', { generateThumbnails: e.target.checked })}
                    />
                    Generate thumbnails automatically
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'interface' && (
              <div className="settings-section">
                <h3>Interface Settings</h3>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.interface.compactMode}
                      onChange={(e) => updatePreferences('interface', { compactMode: e.target.checked })}
                    />
                    Compact mode
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.interface.showPreviewOnHover}
                      onChange={(e) => updatePreferences('interface', { showPreviewOnHover: e.target.checked })}
                    />
                    Show preview on hover
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>Default sort order</label>
                  <select
                    value={preferences.interface.defaultSortOrder}
                    onChange={(e) => updatePreferences('interface', { defaultSortOrder: e.target.value as 'date' | 'name' | 'size' | 'views' })}
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="views">Views</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>Items per page</label>
                  <select
                    value={preferences.interface.itemsPerPage}
                    onChange={(e) => updatePreferences('interface', { itemsPerPage: parseInt(e.target.value) })}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <div className="footer-left">
            <button onClick={handleReset} className="reset-btn">
              Reset to Defaults
            </button>
          </div>
          
          <div className="footer-right">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="save-btn"
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
