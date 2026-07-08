import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_URLS } from '@/config/backend-urls';

export interface User {
  id: number;
  phone: string;
  userId: string;
  createdAt: string;
  sessionToken: string;
  hasAccess?: boolean;
  subscriptionExpiresAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionToken: string | null;
  logout: () => void;
  setAuthData: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('sessionToken');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔐 AuthContext: Checking stored token...', { hasToken: !!storedToken, hasUser: !!storedUser });
      
      if (!storedToken || !storedUser) {
        console.log('❌ AuthContext: No token or user in localStorage');
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        
        console.log('🌐 AuthContext: Verifying token with backend...');
        const response = await fetch(`${BACKEND_URLS.api}?endpoint=verify`, {
          method: 'GET',
          headers: {
            'X-Session-Token': storedToken
          }
        });

        console.log('📡 AuthContext: Backend response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ AuthContext: Token validation result:', data);
          if (data.valid) {
            setUser(parsedUser);
            setSessionToken(storedToken);
          } else {
            console.log('❌ AuthContext: Token invalid, clearing only auth data');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
            setUser(null);
            setSessionToken(null);
          }
        } else {
          console.log('❌ AuthContext: Backend rejected token, clearing only auth data');
          localStorage.removeItem('user');
          localStorage.removeItem('sessionToken');
          setUser(null);
          setSessionToken(null);
        }
      } catch (error) {
        console.error('❌ AuthContext: Token verification failed:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
        setUser(null);
        setSessionToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyStoredToken();
  }, []);

  const setAuthData = (newUser: User, token: string) => {
    console.log('🔄 AuthContext: Manually setting auth data');
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('sessionToken', token);
    setUser(newUser);
    setSessionToken(token);
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out...');
    
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    
    setUser(null);
    setSessionToken(null);
    
    console.log('✅ AuthContext: Auth data cleared, redirecting to /auth');
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionToken, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};
