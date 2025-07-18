import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { database, User, ChecklistAssignment } from '@/services/database';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

interface ChecklistData {
  id: string;
  title: string;
  description: string;
  category: string;
}

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Создание пользователя
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Назначение чек-листа
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedChecklistId, setSelectedChecklistId] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigningChecklist, setIsAssigningChecklist] = useState(false);
  
  // Данные чек-листов
  const checklists: ChecklistData[] = [
    { id: '1', title: 'Запуск нового проекта', description: 'Основные шаги для успешного старта проекта', category: 'Управление проектами' },
    { id: '2', title: 'Подготовка к презентации', description: 'Чек-лист для эффективной презентации', category: 'Продажи' },
    { id: '3', title: 'Онбординг нового сотрудника', description: 'Адаптация сотрудника в первые дни работы', category: 'HR' },
    { id: '4', title: 'Финансовая отчетность', description: 'Ежемесячная финансовая отчетность', category: 'Финансы' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(database.getUsers());
    setAssignments(database.getAssignments());
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    if (!newUserUsername || !newUserPassword) {
      showMessage('error', 'Заполните все обязательные поля');
      setIsCreatingUser(false);
      return;
    }

    const result = database.registerUser(newUserUsername, newUserPassword, newUserRole, currentUser.id);
    
    if (result.success) {
      showMessage('success', result.message);
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('user');
      loadData();
    } else {
      showMessage('error', result.message);
    }
    
    setIsCreatingUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      const result = database.deleteUser(userId, currentUser.id);
      if (result.success) {
        showMessage('success', result.message);
        loadData();
      } else {
        showMessage('error', result.message);
      }
    }
  };

  const handleAssignChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigningChecklist(true);

    if (!selectedUserId || !selectedChecklistId) {
      showMessage('error', 'Выберите пользователя и чек-лист');
      setIsAssigningChecklist(false);
      return;
    }

    const result = database.assignChecklistToUser(
      selectedUserId,
      selectedChecklistId,
      currentUser.id,
      assignmentPriority,
      assignmentDueDate || undefined,
      assignmentNotes || undefined
    );

    if (result.success) {
      showMessage('success', result.message);
      setSelectedUserId('');
      setSelectedChecklistId('');
      setAssignmentPriority('medium');
      setAssignmentDueDate('');
      setAssignmentNotes('');
      loadData();
    } else {
      showMessage('error', result.message);
    }

    setIsAssigningChecklist(false);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это назначение?')) {
      const result = database.removeAssignment(assignmentId);
      if (result.success) {
        showMessage('success', result.message);
        loadData();
      } else {
        showMessage('error', result.message);
      }
    }
  };

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getChecklistById = (id: string) => checklists.find(c => c.id === id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Icon name="Shield" size={24} />
                Панель администратора
              </CardTitle>
              <CardDescription>Управление пользователями и назначениями</CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
              <Icon name={message.type === 'error' ? 'AlertCircle' : 'CheckCircle'} size={16} />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="assignments">Назначения</TabsTrigger>
              <TabsTrigger value="create">Создать</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Логин</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead>Последний вход</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.role !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Чек-лист</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Назначен</TableHead>
                      <TableHead>Срок</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => {
                      const user = getUserById(assignment.userId);
                      const checklist = getChecklistById(assignment.checklistId);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{user?.username || 'Неизвестно'}</TableCell>
                          <TableCell>{checklist?.title || 'Неизвестно'}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(assignment.priority)}>
                              {getPriorityText(assignment.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Создание пользователя */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Создать пользователя</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Логин</Label>
                        <Input
                          id="username"
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                          placeholder="Введите логин"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Введите пароль"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Роль</Label>
                        <Select value={newUserRole} onValueChange={(value: 'admin' | 'user') => setNewUserRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Пользователь</SelectItem>
                            <SelectItem value="admin">Администратор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={isCreatingUser}>
                        {isCreatingUser ? (
                          <>
                            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                            Создание...
                          </>
                        ) : (
                          <>
                            <Icon name="UserPlus" size={16} className="mr-2" />
                            Создать пользователя
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Назначение чек-листа */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Назначить чек-лист</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAssignChecklist} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user">Пользователь</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите пользователя" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.role === 'user').map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checklist">Чек-лист</Label>
                        <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите чек-лист" />
                          </SelectTrigger>
                          <SelectContent>
                            {checklists.map(checklist => (
                              <SelectItem key={checklist.id} value={checklist.id}>{checklist.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Приоритет</Label>
                        <Select value={assignmentPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setAssignmentPriority(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Низкий</SelectItem>
                            <SelectItem value="medium">Средний</SelectItem>
                            <SelectItem value="high">Высокий</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Срок выполнения (необязательно)</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={assignmentDueDate}
                          onChange={(e) => setAssignmentDueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Заметки (необязательно)</Label>
                        <Textarea
                          id="notes"
                          value={assignmentNotes}
                          onChange={(e) => setAssignmentNotes(e.target.value)}
                          placeholder="Дополнительные инструкции..."
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isAssigningChecklist}>
                        {isAssigningChecklist ? (
                          <>
                            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                            Назначение...
                          </>
                        ) : (
                          <>
                            <Icon name="UserCheck" size={16} className="mr-2" />
                            Назначить чек-лист
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;