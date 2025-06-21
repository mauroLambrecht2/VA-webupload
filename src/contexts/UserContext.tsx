import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    window.location.href = `${API_BASE_URL}/auth/discord`;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
      setUser(null);
      setUploads([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        setUser(null);
        setUploads([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setUser(null);
    }
  };

  const refreshUploads = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/uploads`, {
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
  }, []);

  // Fetch uploads when user is available
  useEffect(() => {
    if (user) {
      refreshUploads();
    }
  }, [user]);
  // Check for authentication success/failure in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const authError = urlParams.get('error');
    const authReason = urlParams.get('reason');

    if (authStatus === 'success') {
      // Remove query params and refresh user data
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshUser();
    } else if (authError === 'auth_failed') {
      let errorMessage = 'Discord authentication failed. Please try again.';
      if (authReason === 'guild_access') {
        errorMessage = 'Access denied. You must be a member of the VillainArc guild with the required role.';
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