import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_URLS } from '@/config/backend-urls';

export interface User {
  id: number;
  phone?: string;
  email?: string;
  userId: string;
  createdAt: string;
  sessionToken: string;
  session_token?: string;
  hasAccess?: boolean;
  subscriptionExpiresAt?: string;
  adminImpersonated?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionToken: string | null;
  isAdminImpersonation: boolean;
  logout: () => void;
  setAuthData: (user: User, token: string) => void;
  impersonateUser: (user: User) => void;
  stopAdminImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_SESSION_KEY = 'directkit_admin_session';
const IMPERSONATION_KEY = 'directkit_admin_impersonation';
const BEFORE_IMPERSONATION_KEY = 'directkit_before_impersonation_auth';

const getValidAdminSessionToken = () => {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.token || !session?.expires_at) return null;
    if (new Date(session.expires_at).getTime() <= Date.now()) return null;
    return String(session.token);
  } catch {
    return null;
  }
};

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
  const [isAdminImpersonation, setIsAdminImpersonation] = useState(false);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const impersonationRaw = localStorage.getItem(IMPERSONATION_KEY);
      const adminToken = getValidAdminSessionToken();
      if (impersonationRaw && adminToken) {
        try {
          const impersonatedUser = JSON.parse(impersonationRaw) as User;
          const impersonationToken = `admin-impersonation-${impersonatedUser.id}`;
          localStorage.setItem('user', JSON.stringify(impersonatedUser));
          localStorage.setItem('sessionToken', impersonationToken);
          setUser(impersonatedUser);
          setSessionToken(impersonationToken);
          setIsAdminImpersonation(true);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem(IMPERSONATION_KEY);
        }
      } else if (impersonationRaw && !adminToken) {
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
      }

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
            const freshUser = {
              ...parsedUser,
              id: data.userId || parsedUser.id,
              userId: parsedUser.userId || `user_${data.userId}`,
              email: data.email ?? parsedUser.email,
              phone: data.phone ?? parsedUser.phone,
            };
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
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
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(BEFORE_IMPERSONATION_KEY);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('sessionToken', token);
    setUser(newUser);
    setSessionToken(token);
    setIsAdminImpersonation(false);
  };

  const impersonateUser = (targetUser: User) => {
    const adminToken = getValidAdminSessionToken();
    if (!adminToken) {
      throw new Error('Admin session required');
    }

    const currentUser = localStorage.getItem('user');
    const currentToken = localStorage.getItem('sessionToken');
    if (!localStorage.getItem(BEFORE_IMPERSONATION_KEY) && currentUser && currentToken && !localStorage.getItem(IMPERSONATION_KEY)) {
      localStorage.setItem(BEFORE_IMPERSONATION_KEY, JSON.stringify({ user: currentUser, sessionToken: currentToken }));
    }

    const impersonatedUser: User = {
      ...targetUser,
      id: Number(targetUser.id),
      userId: targetUser.userId || `user_${targetUser.id}`,
      sessionToken: `admin-impersonation-${targetUser.id}`,
      adminImpersonated: true,
    };
    const impersonationToken = impersonatedUser.sessionToken;
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonatedUser));
    localStorage.setItem('user', JSON.stringify(impersonatedUser));
    localStorage.setItem('sessionToken', impersonationToken);
    setUser(impersonatedUser);
    setSessionToken(impersonationToken);
    setIsAdminImpersonation(true);
  };

  const stopAdminImpersonation = () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    const previousRaw = localStorage.getItem(BEFORE_IMPERSONATION_KEY);
    localStorage.removeItem(BEFORE_IMPERSONATION_KEY);

    if (previousRaw) {
      try {
        const previous = JSON.parse(previousRaw);
        localStorage.setItem('user', previous.user);
        localStorage.setItem('sessionToken', previous.sessionToken);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionToken');
    }

    setUser(null);
    setSessionToken(null);
    setIsAdminImpersonation(false);
    window.location.href = '/admin/users';
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out...');

    if (isAdminImpersonation) {
      stopAdminImpersonation();
      return;
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(BEFORE_IMPERSONATION_KEY);
    
    setUser(null);
    setSessionToken(null);
    setIsAdminImpersonation(false);
    
    console.log('✅ AuthContext: Auth data cleared, redirecting to /auth');
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionToken, isAdminImpersonation, logout, setAuthData, impersonateUser, stopAdminImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
};
