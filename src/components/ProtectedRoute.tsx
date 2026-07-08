import { Navigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, sessionToken, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Icon name="Loader2" size={48} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user || !sessionToken) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
