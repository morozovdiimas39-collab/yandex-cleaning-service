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

const API_URL = 'https://functions.yandexcloud.net/d4evvvtl510ma4bh4iq5';

export default function Auth() {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const { toast } = useToast();
  const { setAuthData } = useAuth();
  const navigate = useNavigate();



  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Автоматически добавляем 7 если начинают вводить с 8 или 9
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
    try {
      const response = await fetch(`${API_URL}?endpoint=auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_code',
          phone: digits
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send code');
      }

      const data = await response.json();
      setSentCode(data.code);
      setStep('code');
      toast({ 
        title: '📱 Код отправлен', 
        description: `Проверьте SMS на номере ${phone}. Код: ${data.code}` 
      });
    } catch (error) {
      toast({ 
        title: 'Ошибка отправки кода', 
        description: 'Попробуйте снова', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (code.length !== 4) {
      toast({ title: 'Введите 4-значный код', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const response = await fetch(`${API_URL}?endpoint=auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_code',
          phone: digits,
          code: code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify code');
      }

      const data = await response.json();
      
      const userId = `user_${data.userId}_${Date.now().toString(36)}`;
      const user = {
        id: data.userId,
        phone: data.phone,
        userId: userId,
        createdAt: new Date().toISOString(),
        sessionToken: data.sessionToken
      };

      console.log('🔑 Saving to localStorage and AuthContext:', user);
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('sessionToken', data.sessionToken);
      
      console.log('✅ Updating AuthContext with new user data');
      setAuthData(user, data.sessionToken);

      toast({ title: '✅ Добро пожаловать!', description: 'Вход выполнен успешно' });
      
      console.log('🚀 Navigating to /clustering');
      navigate('/clustering');
    } catch (error: any) {
      toast({ 
        title: 'Ошибка входа', 
        description: error.message || 'Проверьте код и попробуйте снова', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setCode('');
  };

  const handleResendCode = async () => {
    await handlePhoneSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-4">
            <Icon name="Zap" size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            DirectKit
          </h1>
          <p className="text-muted-foreground">
            Сервис сбора семантического ядра
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 'phone' ? 'Вход в систему' : 'Подтверждение'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'Введите номер телефона для входа' 
                : `Код отправлен на ${phone}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <div className="relative">
                    <Icon name="Phone" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                      className="pl-10 text-lg"
                      maxLength={18}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePhoneSubmit} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Отправка кода...
                    </>
                  ) : (
                    <>
                      Получить код
                      <Icon name="ArrowRight" size={20} className="ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <div>
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <a href="#" className="text-emerald-600 hover:underline font-medium">
                      условиями использования
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      toast({ title: '✅ Вы вышли из аккаунта' });
                    }}
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти из аккаунта
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Код из SMS</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="• • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={4}
                    autoFocus
                  />
                  {sentCode && (
                    <p className="text-sm text-center text-slate-500">
                      Код для теста: <span className="font-mono font-bold">{sentCode}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleBack} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Назад
                  </Button>
                  
                  <Button 
                    onClick={handleCodeSubmit} 
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                </div>

                <Button 
                  onClick={handleResendCode} 
                  variant="ghost" 
                  className="w-full"
                  disabled={loading}
                >
                  <Icon name="RefreshCw" size={16} className="mr-2" />
                  Отправить код повторно
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
