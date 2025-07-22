import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import AuthForm from '@/components/AuthForm';
import AdminPanel from '@/components/AdminPanel';
import { database, User } from '@/services/database';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  title: string;
  description: string;
  category: string;
  items: ChecklistItem[];
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [checklists, setChecklists] = useState<Checklist[]>([
    {
      id: '1',
      title: 'Запуск нового проекта',
      description: 'Основные шаги для успешного старта проекта',
      category: 'Управление проектами',
      items: [
        { id: '1-1', text: 'Определить цели и задачи проекта', completed: false },
        { id: '1-2', text: 'Составить бюджет проекта', completed: false },
        { id: '1-3', text: 'Сформировать команду', completed: false },
        { id: '1-4', text: 'Создать план проекта', completed: false },
        { id: '1-5', text: 'Определить риски', completed: false },
      ]
    },
    {
      id: '2',
      title: 'Подготовка к презентации',
      description: 'Чек-лист для эффективной презентации',
      category: 'Продажи',
      items: [
        { id: '2-1', text: 'Изучить целевую аудиторию', completed: false },
        { id: '2-2', text: 'Подготовить структуру презентации', completed: false },
        { id: '2-3', text: 'Создать визуальные материалы', completed: false },
        { id: '2-4', text: 'Отрепетировать выступление', completed: false },
        { id: '2-5', text: 'Подготовить ответы на вопросы', completed: false },
      ]
    },
    {
      id: '3',
      title: 'Онбординг нового сотрудника',
      description: 'Адаптация сотрудника в первые дни работы',
      category: 'HR',
      items: [
        { id: '3-1', text: 'Подготовить рабочее место', completed: false },
        { id: '3-2', text: 'Провести знакомство с командой', completed: false },
        { id: '3-3', text: 'Оформить доступы к системам', completed: false },
        { id: '3-4', text: 'Провести вводное обучение', completed: false },
        { id: '3-5', text: 'Назначить ментора', completed: false },
      ]
    },
    {
      id: '4',
      title: 'Финансовая отчетность',
      description: 'Ежемесячная финансовая отчетность',
      category: 'Финансы',
      items: [
        { id: '4-1', text: 'Собрать все документы', completed: false },
        { id: '4-2', text: 'Проверить балансы', completed: false },
        { id: '4-3', text: 'Составить отчет о прибылях и убытках', completed: false },
        { id: '4-4', text: 'Подготовить аналитику по расходам', completed: false },
        { id: '4-5', text: 'Подписать отчеты у руководства', completed: false },
      ]
    }
  ]);

  const categories = ['all', 'Управление проектами', 'Продажи', 'HR', 'Финансы'];

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(checklist => {
      if (checklist.id === checklistId) {
        const updatedChecklist = {
          ...checklist,
          items: checklist.items.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
        
        // Сохраняем прогресс в базу
        if (user) {
          const completedItems = updatedChecklist.items
            .filter(item => item.completed)
            .map(item => item.id);
          
          database.saveProgress({
            id: `${user.id}-${checklistId}`,
            userId: user.id,
            checklistId,
            completedItems,
            lastUpdated: new Date().toISOString()
          });
        }
        
        return updatedChecklist;
      }
      return checklist;
    }));
  };

  const getCompletionPercentage = (items: ChecklistItem[]) => {
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    loadUserProgress(userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    // Сбрасываем прогресс чек-листов
    setChecklists(prev => prev.map(checklist => ({
      ...checklist,
      items: checklist.items.map(item => ({ ...item, completed: false }))
    })));
  };

  const loadUserProgress = (userId: string) => {
    const userProgress = database.getUserAllProgress(userId);
    
    setChecklists(prev => prev.map(checklist => {
      const progress = userProgress.find(p => p.checklistId === checklist.id);
      if (progress) {
        return {
          ...checklist,
          items: checklist.items.map(item => ({
            ...item,
            completed: progress.completedItems.includes(item.id)
          }))
        };
      }
      return checklist;
    }));
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  const isAdmin = user?.role === 'admin';
  const userAssignments = user ? database.getUserAssignments(user.id) : [];
  
  // Фильтруем чек-листы по назначениям для обычных пользователей
  const availableChecklists = isAdmin ? checklists : checklists.filter(checklist => 
    userAssignments.some(assignment => assignment.checklistId === checklist.id)
  );

  const filteredChecklists = availableChecklists.filter(checklist => {
    const matchesSearch = checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || checklist.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Icon name="ClipboardList" size={32} className="text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Business Checklists</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8 items-center">
                <a href="#" className="text-gray-700 hover:text-primary font-medium">Главная</a>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminPanel(true)}
                    className="text-xl font-bold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    👥 ПОЛЬЗОВАТЕЛИ
                  </button>
                )}
                <a href="#" className="text-gray-700 hover:text-primary font-medium">Категории</a>
                <a href="#" className="text-gray-700 hover:text-primary font-medium">О проекте</a>
                <a href="#" className="text-gray-700 hover:text-primary font-medium">Контакты</a>
              </nav>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Icon name="User" size={16} />
                  <span>Добро пожаловать, {user.username}</span>
                  {isAdmin && (
                    <Badge variant="default" className="ml-2">
                      <Icon name="Shield" size={12} className="mr-1" />
                      Администратор
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAdminPanel(true)}
                      className="flex items-center space-x-1"
                    >
                      <Icon name="Settings" size={16} />
                      <span>Админ-панель</span>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Выйти</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Профессиональные чек-листы для бизнеса</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Структурированные списки задач для эффективного управления бизнес-процессами
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
            <Icon name="Search" size={20} className="mr-2" />
            Найти чек-лист
          </Button>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Поиск чек-листов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'Все категории' : category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checklists Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChecklists.map(checklist => {
              const completionPercentage = getCompletionPercentage(checklist.items);
              return (
                <Card key={checklist.id} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{checklist.title}</CardTitle>
                        <CardDescription>{checklist.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {checklist.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-12">{completionPercentage}%</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {checklist.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(checklist.id, item.id)}
                          />
                          <label 
                            htmlFor={item.id}
                            className={`text-sm cursor-pointer flex-1 ${
                              item.completed 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-700'
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Icon name="ClipboardList" size={24} />
                <span className="text-lg font-bold">Business Checklists</span>
              </div>
              <p className="text-gray-400">
                Профессиональные чек-листы для эффективного управления бизнес-процессами
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Категории</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Управление проектами</a></li>
                <li><a href="#" className="hover:text-white">Продажи</a></li>
                <li><a href="#" className="hover:text-white">HR</a></li>
                <li><a href="#" className="hover:text-white">Финансы</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">О проекте</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Как это работает</a></li>
                <li><a href="#" className="hover:text-white">Преимущества</a></li>
                <li><a href="#" className="hover:text-white">Отзывы</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Icon name="Mail" size={16} />
                  <span>info@business-checklists.ru</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="Phone" size={16} />
                  <span>+7 (495) 123-45-67</span>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Business Checklists. Все права защищены.</p>
          </div>
        </div>
      </footer>
      
      {/* Админ-панель */}
      {showAdminPanel && isAdmin && (
        <AdminPanel 
          currentUser={user} 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
    </div>
  );
};

export default Index;