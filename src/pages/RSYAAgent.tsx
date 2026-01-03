import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: any[];
  platformsData?: any;
  goalsData?: any[];
  needsGoalSelection?: boolean;
  needsTargetCPA?: boolean;
  needsConfirmation?: boolean;
}

const RSYA_AGENT_URL = BACKEND_URLS['rsya-agent'] || '';
const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';

export default function RSYAAgent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [visualizationData, setVisualizationData] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    
    loadProjects(uid);
    
    // Приветственное сообщение
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '👋 Привет! Я Антон — твой ассистент по чистке РСЯ.\n\n**Что я делаю:**\n• Анализирую площадки РСЯ за последние 7 дней\n• Нахожу мусорные домены (.com, .dsp, .vvpn)\n• Определяю площадки с 0 конверсий\n• Показываю площадки с низким CTR\n\n**Объясняю ЧТО и ПОЧЕМУ блокируем**, чтобы ты понимал каждое решение.\n\nВыбери проект и напиши "проанализируй площадки" 🚀',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjects = async (uid: string) => {
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        headers: { 'X-User-Id': uid }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Автоматически выбираем первый проект если есть
        if (data.projects && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Формируем историю для агента
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(RSYA_AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          message: inputMessage,
          project_id: selectedProjectId,
          history: history
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка запроса к агенту');
      }

      const data = await response.json();

      // Извлекаем данные из actions
      const platformsAction = data.actions?.find((a: any) => a.function === 'analyze_rsya_platforms' && a.data);
      const goalsAction = data.actions?.find((a: any) => a.function === 'get_conversion_goals' && a.data);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
        platformsData: platformsAction?.data,
        goalsData: goalsAction?.data,
        needsGoalSelection: !!goalsAction,
        needsConfirmation: !!(platformsAction && platformsAction.data?.to_block?.length > 0)
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Обновляем визуализацию если есть данные
      if (data.actions && data.actions.length > 0) {
        const campaignAction = data.actions.find((a: any) => a.function === 'get_campaigns' && a.data);
        const platformsAction = data.actions.find((a: any) => a.function === 'analyze_rsya_platforms' && a.data);
        
        if (campaignAction) {
          setVisualizationData({
            type: 'campaigns',
            data: campaignAction.data
          });
        } else if (platformsAction) {
          setVisualizationData({
            type: 'platforms',
            data: platformsAction.data
          });
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Ошибка: ${error.message}\n\n${error.message.includes('GEMINI_API_KEY') ? 'Пожалуйста, добавь API ключ Gemini в настройках проекта.' : 'Попробуй переформулировать запрос.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewProject = async () => {
    const projectName = prompt('Название нового проекта:');
    if (!projectName) return;

    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ name: projectName })
      });

      if (!response.ok) throw new Error('Ошибка создания проекта');

      const data = await response.json();
      setProjects(prev => [data.project, ...prev]);
      setSelectedProjectId(data.project.id);
      
      toast({ title: '✅ Проект создан!', description: `Проект "${projectName}" готов к работе` });
      
      // Добавляем сообщение от агента
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Отлично! Проект "${projectName}" создан.\n\nТеперь нужно подключить Яндекс.Директ. Скажи "подключи яндекс" или перейди в настройки проекта.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, welcomeMessage]);

    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать проект', variant: 'destructive' });
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/50 ml-64">
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/rsya')} variant="ghost" size="icon">
                <Icon name="ArrowLeft" className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="Sparkles" className="h-6 w-6 text-purple-500" />
                  Антон — AI-маркетолог
                </h1>
                <p className="text-sm text-slate-600">
                  {selectedProject ? `Проект: ${selectedProject.name}` : 'Выбери проект или создай новый'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={createNewProject}
              >
                <Icon name="Plus" className="h-4 w-4 mr-2" />
                Новый проект
              </Button>
              
              {selectedProjectId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/rsya/${selectedProjectId}`)}
                >
                  <Icon name="Settings" className="h-4 w-4 mr-2" />
                  Настройки
                </Button>
              )}
            </div>
          </div>

          {/* Main Content: Chat Only */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area (Full Width) */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <Card
                        className={`${message.platformsData ? 'w-full' : 'max-w-[80%]'} ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <Icon name="Sparkles" className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </div>
                              
                              {/* Чекбоксы с целями */}
                              {message.goalsData && message.goalsData.length > 0 && (
                                <div className="mt-4 border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Icon name="Target" className="h-4 w-4 text-blue-600" />
                                    Выбери важные цели для анализа:
                                  </h4>
                                  <div className="space-y-2">
                                    {message.goalsData.map((goal: any, idx: number) => (
                                      <label key={goal.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 p-2 rounded">
                                        <input 
                                          type="checkbox" 
                                          className="w-4 h-4 text-blue-600"
                                          id={`goal-${goal.id}`}
                                        />
                                        <span className="text-sm text-slate-700">
                                          {idx + 1}. {goal.name} <span className="text-slate-500">(ID: {goal.id})</span>
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const checked = document.querySelectorAll('input[type="checkbox"]:checked');
                                      const selectedIds = Array.from(checked).map(el => 
                                        (el as HTMLInputElement).id.replace('goal-', '')
                                      );
                                      if (selectedIds.length > 0) {
                                        setInputMessage(`Выбрал цели: ${selectedIds.join(', ')}`);
                                      }
                                    }}
                                    className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Продолжить с выбранными целями
                                  </button>
                                </div>
                              )}
                              
                              {/* Таблица площадок если есть данные */}
                              {message.platformsData && (
                                <div className="mt-4 space-y-4">
                                  {/* Площадки на блокировку */}
                                  {message.platformsData.to_block && message.platformsData.to_block.length > 0 && (
                                    <div className="border border-red-200 rounded-lg overflow-hidden">
                                      <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                                        <h4 className="font-semibold text-red-900 flex items-center gap-2">
                                          <Icon name="Ban" className="h-4 w-4" />
                                          Площадки на блокировку ({message.platformsData.to_block.length})
                                        </h4>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <thead className="bg-red-50/50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-slate-700">Площадка</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">Расход</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">CTR</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">Конверсии</th>
                                              <th className="px-3 py-2 text-left font-medium text-slate-700">Причина</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {message.platformsData.to_block.slice(0, 10).map((platform: any, idx: number) => (
                                              <tr key={idx} className="hover:bg-red-50/30">
                                                <td className="px-3 py-2 text-slate-900 font-mono text-xs">{platform.domain}</td>
                                                <td className="px-3 py-2 text-right text-red-600 font-semibold">{platform.cost.toFixed(2)}₽</td>
                                                <td className="px-3 py-2 text-right text-slate-600">{platform.ctr}%</td>
                                                <td className="px-3 py-2 text-right text-slate-600">{platform.conversions}</td>
                                                <td className="px-3 py-2 text-slate-600 text-xs">{platform.reason}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {message.platformsData.to_block.length > 10 && (
                                        <div className="bg-red-50 px-4 py-2 text-xs text-slate-600 border-t border-red-200">
                                          + ещё {message.platformsData.to_block.length - 10} площадок
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Площадки которые оставляем */}
                                  {message.platformsData.to_keep && message.platformsData.to_keep.length > 0 && (
                                    <div className="border border-green-200 rounded-lg overflow-hidden">
                                      <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                                        <h4 className="font-semibold text-green-900 flex items-center gap-2">
                                          <Icon name="CheckCircle" className="h-4 w-4" />
                                          Площадки которые оставляем (топ-5)
                                        </h4>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <thead className="bg-green-50/50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-slate-700">Площадка</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">Расход</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">CTR</th>
                                              <th className="px-3 py-2 text-right font-medium text-slate-700">Конверсии</th>
                                              <th className="px-3 py-2 text-left font-medium text-slate-700">Причина</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {message.platformsData.to_keep.slice(0, 5).map((platform: any, idx: number) => (
                                              <tr key={idx} className="hover:bg-green-50/30">
                                                <td className="px-3 py-2 text-slate-900 font-mono text-xs">{platform.domain}</td>
                                                <td className="px-3 py-2 text-right text-green-600 font-semibold">{platform.cost.toFixed(2)}₽</td>
                                                <td className="px-3 py-2 text-right text-slate-600">{platform.ctr}%</td>
                                                <td className="px-3 py-2 text-right text-slate-600">{platform.conversions}</td>
                                                <td className="px-3 py-2 text-slate-600 text-xs">{platform.reason}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Кнопка подтверждения блокировки */}
                                  {message.needsConfirmation && message.platformsData?.to_block && (
                                    <div className="mt-4 flex gap-2">
                                      <button
                                        onClick={async () => {
                                          setInputMessage('Да, заблокируй эти площадки');
                                          setTimeout(() => sendMessage(), 100);
                                        }}
                                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-semibold flex items-center justify-center gap-2"
                                      >
                                        <Icon name="Ban" className="h-5 w-5" />
                                        Заблокировать {message.platformsData.to_block.length} площадок
                                      </button>
                                      <button
                                        onClick={() => {
                                          setInputMessage('Нет, не блокируй');
                                          setTimeout(() => sendMessage(), 100);
                                        }}
                                        className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all font-semibold"
                                      >
                                        Отмена
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                                <Icon name="User" className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <Card className="bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              <Icon name="Sparkles" className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Input Area */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex gap-2">
                  <Input
                    placeholder={isLoading ? "⏳ Антон думает..." : "Напиши что нужно... (например: покажи активные кампании)"}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`flex-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <Icon name="Loader2" className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon name="Send" className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {isLoading ? (
                  <p className="text-xs text-purple-600 mt-2 font-medium animate-pulse">
                    ⚡ Антон анализирует данные, это может занять 10-30 секунд...
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Совет: Напиши "проанализируй площадки" или "покажи кампании"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}