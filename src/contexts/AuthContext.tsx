import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (phone: string) => Promise<void>;
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
        const response = await fetch('https://functions.poehali.dev/06df3397-13af-46f0-946a-f5d38aa6f60f?endpoint=verify', {
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

  const login = async (phone: string) => {
    const response = await fetch('https://functions.yandexcloud.net/d4evvvtl510ma4bh4iq5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    
    if (!response.ok) {
      throw new Error('Failed to login');
    }
    
    const userData = await response.json();
    const userId = `user_${userData.id}_${Date.now().toString(36)}`;
    const newUser: User = {
      id: userData.id,
      phone: userData.phone,
      userId: userId,
      createdAt: userData.createdAt,
      sessionToken: userData.sessionToken
    };
    
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('sessionToken', userData.sessionToken);
    setSessionToken(userData.sessionToken);
    setUser(newUser);
  };

  const setAuthData = (newUser: User, token: string) => {
    console.log('🔄 AuthContext: Manually setting auth data');
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
    <AuthContext.Provider value={{ user, isLoading, sessionToken, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};
