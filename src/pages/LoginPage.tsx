import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('userId', '1');
    localStorage.setItem('userPhone', '+79991234567');
    navigate('/clustering');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <Icon name="Loader2" size={48} className="animate-spin text-emerald-600 mx-auto mb-4" />
        <p className="text-slate-600">Вход в систему...</p>
      </div>
    </div>
  );
}
