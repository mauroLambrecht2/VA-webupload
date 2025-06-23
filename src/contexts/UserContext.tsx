import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuthStatus, logout as logoutUtil, initiateLogin } from '../utils/authUtils';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://va-expressupload.onrender.com'
  : 'http://localhost:8000';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  verified: boolean;
  loginTime: string;
  guildMember: boolean;
  hasRole: boolean;
  uploadStats: {
    totalSize: number;
    uploadCount: number;
    quota: number; // 5GB in bytes
    remainingQuota: number;
    quotaPercentUsed: number;
  };
}

export interface UserUpload {
  id: string;
  originalName: string;
  size: number;
  uploadDate: string;
  shareLink: string;
}

interface UserContextType {
  user: User | null;
  uploads: UserUpload[];
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshUploads: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const login = () => {
    initiateLogin();
  };

  const logout = async () => {
    try {
      await logoutUtil();
      setUser(null);
      setUploads([]);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    try {
      setError(null);
      const authData = await checkAuthStatus();

      if (authData.authenticated && authData.user) {
        // Map the backend user data to frontend format
        const mappedUser: User = {
          id: authData.user.id,
          username: authData.user.username,
          discriminator: authData.user.discriminator,
          avatar: authData.user.avatar,
          verified: authData.user.verified || true,
          loginTime: authData.user.loginTime || new Date().toISOString(),
          guildMember: authData.user.guildMember,
          hasRole: authData.user.hasRole,
          uploadStats: {
            totalSize: authData.user.totalUploadSize || 0,
            uploadCount: authData.user.uploads?.length || 0,
            quota: authData.user.quota || 5 * 1024 * 1024 * 1024, // 5GB
            remainingQuota: (authData.user.quota || 5 * 1024 * 1024 * 1024) - (authData.user.totalUploadSize || 0),
            quotaPercentUsed: ((authData.user.totalUploadSize || 0) / (authData.user.quota || 5 * 1024 * 1024 * 1024)) * 100
          }
        };
        setUser(mappedUser);
        console.log('✅ User data refreshed:', mappedUser);
      } else {
        setUser(null);
        console.log('❌ No authenticated user found');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setUser(null);
    }
  };

  const refreshUploads = async () => {
    if (!user) return;

    try {      const response = await fetch(`${API_BASE_URL}/auth/user/uploads`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.status}`);
      }

      const uploadsData = await response.json();
      setUploads(uploadsData.uploads || []);
    } catch (err) {
      console.error('Error fetching uploads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch uploads');
    }
  };
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    checkAuth();

    // Set up periodic auth check every 5 minutes
    const authCheckInterval = setInterval(async () => {
      if (!loading) {
        console.log('🔄 Periodic auth check...');
        await refreshUser();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(authCheckInterval);
  }, []);

  // Fetch uploads when user is available
  useEffect(() => {
    if (user) {
      refreshUploads();
    }
  }, [user]);  // Check for authentication success/failure in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const authError = urlParams.get('error');
    const authReason = urlParams.get('reason');

    if (authStatus === 'success') {
      console.log('🎉 Authentication success detected in URL');
      // Remove query params and refresh user data
      window.history.replaceState({}, document.title, window.location.pathname);
      // Give a moment for session to be fully established
      setTimeout(() => {
        refreshUser();
      }, 500);
    } else if (authStatus === 'failed') {
      let errorMessage = 'Discord authentication failed. Please try again.';
      
      if (authError === 'guild_access') {
        if (authReason === 'not_member') {
          errorMessage = 'Access denied. You must be a member of the VillainArc Discord server.';
        } else if (authReason === 'no_role') {
          errorMessage = 'Access denied. You need the required role in the VillainArc Discord server.';
        } else {
          errorMessage = 'Access denied. You must be a member of the VillainArc Discord server with the required role.';
        }
      } else if (authError === 'oauth_failed') {
        errorMessage = 'Discord OAuth failed. Please try again.';
      } else if (authError === 'session_error') {
        errorMessage = 'Session error occurred. Please try logging in again.';
      }
      
      setError(errorMessage);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const value: UserContextType = {
    user,
    uploads,
    loading,
    error,
    login,
    logout,
    refreshUser,
    refreshUploads
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};