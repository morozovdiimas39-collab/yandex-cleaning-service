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
        content: '👋 Привет! Я Антон, твой AI-помощник по Яндекс.Директ и чистке РСЯ. Гений в маркетинге! 🎯\n\nЧто я умею:\n• Получать статистику по ВСЕМ кампаниям (включая товарные и мастера)\n• Анализировать площадки РСЯ\n• Находить проблемные домены\n• Настраивать автоматическую чистку\n\nВыбери проект слева или создай новый, и давай начнём!',
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

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: data.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Обновляем визуализацию если есть данные
      if (data.actions && data.actions.length > 0) {
        const campaignAction = data.actions.find((a: any) => a.function === 'get_campaigns' && a.data);
        if (campaignAction) {
          setVisualizationData({
            type: 'campaigns',
            data: campaignAction.data
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

          {/* Main Content: Chat + Visualization */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area (Left) */}
            <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="max-w-3xl mx-auto space-y-4 w-full">
                {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
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
                        <div className="flex-1 whitespace-pre-wrap text-sm">
                          {message.content}
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
              
              {/* Input Area */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Напиши что нужно... (например: покажи активные кампании)"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
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
                <p className="text-xs text-slate-500 mt-2">
                  💡 Совет: Спроси "что ты умеешь?" чтобы узнать все возможности
                </p>
              </div>
            </div>

            {/* Visualization Panel (Right) */}
            <div className="w-[600px] bg-white flex flex-col">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Icon name="BarChart3" className="h-5 w-5 text-purple-600" />
                  Данные
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {visualizationData ? (
                  <div>
                    {visualizationData.type === 'campaigns' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-900">Кампании</h3>
                          <span className="text-sm text-slate-600">
                            Всего: {visualizationData.data.length}
                          </span>
                        </div>
                        
                        {/* Статистика сверху */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-slate-600">Общий расход</div>
                              <div className="text-lg font-bold text-slate-900">
                                {visualizationData.data.reduce((sum: number, c: any) => sum + (c.cost || 0), 0).toFixed(2)}₽
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-slate-600">Клики</div>
                              <div className="text-lg font-bold text-slate-900">
                                {visualizationData.data.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0)}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-slate-600">Конверсии</div>
                              <div className="text-lg font-bold text-slate-900">
                                {visualizationData.data.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Список кампаний */}
                        <div className="space-y-2">
                          {visualizationData.data.map((campaign: any) => (
                            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="font-medium text-slate-900 mb-2">{campaign.name}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  <div>
                                    <span className="text-xs">ID:</span> {campaign.id}
                                  </div>
                                  <div>
                                    <span className="text-xs">Тип:</span> {campaign.type}
                                  </div>
                                  {campaign.clicks > 0 && (
                                    <div>
                                      <span className="text-xs">Клики:</span> {campaign.clicks}
                                    </div>
                                  )}
                                  {campaign.cost > 0 && (
                                    <div>
                                      <span className="text-xs">Расход:</span> {campaign.cost.toFixed(2)}₽
                                    </div>
                                  )}
                                  {campaign.conversions > 0 && (
                                    <div className="col-span-2">
                                      <span className="text-xs">Конверсии:</span> {campaign.conversions}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Icon name="BarChart3" className="h-16 w-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium mb-2">Данных пока нет</p>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Запроси у Антона данные о кампаниях, площадках или статистике, и они появятся здесь
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}