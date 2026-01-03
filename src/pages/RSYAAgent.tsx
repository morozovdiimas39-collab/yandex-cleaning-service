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
        content: '👋 Привет! Я AI-ассистент для управления РСЯ.\n\nЯ помогу тебе:\n• Анализировать площадки\n• Находить проблемные домены\n• Создавать задачи автоматической чистки\n• Оптимизировать расходы\n\nВыбери проект слева или создай новый, и давай начнём!',
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
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/rsya')} variant="ghost" size="icon">
                <Icon name="ArrowLeft" className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="Sparkles" className="h-6 w-6 text-purple-500" />
                  AI-Ассистент РСЯ
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

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
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
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-600 mb-2">Действия:</p>
                          {message.actions.map((action, idx) => (
                            <div key={idx} className="text-xs bg-slate-50 p-2 rounded">
                              {JSON.stringify(action)}
                            </div>
                          ))}
                        </div>
                      )}
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
          <div className="bg-white border-t border-slate-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="Напиши что нужно сделать... (например: покажи площадки без конверсий)"
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
        </div>
      </div>
    </>
  );
}
