import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

type AuthStep = 'phone' | 'code';

export default function Auth() {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentCode, setSentCode] = useState('1234');
  const { toast } = useToast();
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    if (digits[0] === '8') {
      digits = '7' + digits.slice(1);
    }
    if (digits[0] !== '7') {
      digits = '7' + digits;
    }
    
    let result = '+7';
    if (digits.length > 1) {
      result += ` (${digits.slice(1, 4)}`;
    }
    if (digits.length >= 4) {
      result += `) ${digits.slice(4, 7)}`;
    }
    if (digits.length >= 7) {
      result += `-${digits.slice(7, 9)}`;
    }
    if (digits.length >= 9) {
      result += `-${digits.slice(9, 11)}`;
    }
    
    return result;
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      toast({ title: 'Введите корректный номер телефона', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setSentCode('1234');
      setStep('code');
      setLoading(false);
      toast({ 
        title: '📱 Код отправлен', 
        description: 'Введите код: 1234' 
      });
    }, 500);
  };

  const handleCodeSubmit = async () => {
    if (code.length !== 4) {
      toast({ title: 'Введите 4-значный код', variant: 'destructive' });
      return;
    }

    if (code !== sentCode) {
      toast({ 
        title: 'Неверный код', 
        description: 'Проверьте код и попробуйте снова', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);

    const digits = phone.replace(/\D/g, '');
    const mockUser = {
      id: digits,
      phone: phone,
      createdAt: new Date().toISOString()
    };
    
    const mockToken = `token_${digits}_${Date.now()}`;
    
    setAuthData(mockUser, mockToken);
    
    toast({ 
      title: '✅ Вход выполнен', 
      description: 'Добро пожаловать!' 
    });
    
    setTimeout(() => {
      navigate('/home');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Icon name="Zap" size={20} className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">DirectKit</CardTitle>
          </div>
          <CardDescription>
            {step === 'phone' ? 'Введите номер телефона для входа' : 'Введите код из SMS'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={18}
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                />
              </div>
              <Button 
                onClick={handlePhoneSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Отправка...' : 'Получить код'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Код подтверждения</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="1234"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Код отправлен на {phone}
                </p>
              </div>
              <Button 
                onClick={handleCodeSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Проверка...' : 'Войти'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('phone')}
                className="w-full"
                disabled={loading}
              >
                Изменить номер
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}