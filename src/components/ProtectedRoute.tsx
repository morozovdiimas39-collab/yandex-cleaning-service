import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log('🔒 ProtectedRoute check:', { isLoading, hasUser: !!user });

  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading...');
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedRoute: User authenticated, allowing access');
  return <>{children}</>;
}