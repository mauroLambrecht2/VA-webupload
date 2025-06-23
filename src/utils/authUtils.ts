// Utility functions for authentication

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://va-expressupload.onrender.com'
  : 'http://localhost:8000';

export const checkAuthStatus = async (): Promise<{ authenticated: boolean; user?: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      credentials: 'include',
      method: 'GET'
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
};

export const testAuth = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/test-auth`, {
      credentials: 'include',
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Auth test failed:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export const initiateLogin = (): void => {
  window.location.href = `${API_BASE_URL}/auth/discord`;
};
