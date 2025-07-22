// Локальная база данных для имитации работы с БД
// В реальном проекте здесь будет подключение к настоящей базе данных

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  createdBy?: string; // ID пользователя, который создал этого пользователя
}

export interface ChecklistProgress {
  id: string;
  userId: string;
  checklistId: string;
  completedItems: string[];
  lastUpdated: string;
}

export interface ChecklistAssignment {
  id: string;
  userId: string;
  checklistId: string;
  assignedBy: string; // ID администратора
  assignedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

class DatabaseService {
  private USERS_KEY = 'business_checklists_users';
  private PROGRESS_KEY = 'business_checklists_progress';
  private ASSIGNMENTS_KEY = 'business_checklists_assignments';

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Создаем базового админа, если его нет, или обновляем существующего
    const users = this.getUsers();
    const existingAdmin = users.find(u => u.username === 'admin');
    
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      createdAt: existingAdmin?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // Всегда сохраняем/обновляем админа, чтобы гарантировать правильную роль
    this.saveUser(adminUser);
  }

  // Работа с пользователями
  getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  // Функция для сброса базы данных (для отладки)
  resetDatabase(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
    localStorage.removeItem(this.ASSIGNMENTS_KEY);
    this.initializeDatabase();
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  findUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  authenticateUser(username: string, password: string): User | null {
    const user = this.findUserByUsername(username);
    if (user && user.password === password) {
      // Обновляем время последнего входа
      user.lastLogin = new Date().toISOString();
      this.saveUser(user);
      return user;
    }
    return null;
  }

  registerUser(username: string, password: string, role: 'admin' | 'user' = 'user', createdBy?: string): { success: boolean; message: string; user?: User } {
    if (this.findUserByUsername(username)) {
      return { success: false, message: 'Пользователь с таким логином уже существует' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      createdBy
    };

    this.saveUser(newUser);
    return { success: true, message: 'Пользователь успешно зарегистрирован', user: newUser };
  }

  // Работа с прогрессом чек-листов
  getProgress(): ChecklistProgress[] {
    const progress = localStorage.getItem(this.PROGRESS_KEY);
    return progress ? JSON.parse(progress) : [];
  }

  saveProgress(progress: ChecklistProgress): void {
    const allProgress = this.getProgress();
    const existingIndex = allProgress.findIndex(p => 
      p.userId === progress.userId && p.checklistId === progress.checklistId
    );
    
    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }
    
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(allProgress));
  }

  getUserProgress(userId: string, checklistId: string): ChecklistProgress | null {
    const allProgress = this.getProgress();
    return allProgress.find(p => p.userId === userId && p.checklistId === checklistId) || null;
  }

  getUserAllProgress(userId: string): ChecklistProgress[] {
    const allProgress = this.getProgress();
    return allProgress.filter(p => p.userId === userId);
  }

  // Статистика
  getUserStats(userId: string): {
    totalChecklists: number;
    completedChecklists: number;
    totalItems: number;
    completedItems: number;
  } {
    const userProgress = this.getUserAllProgress(userId);
    
    return {
      totalChecklists: userProgress.length,
      completedChecklists: userProgress.filter(p => p.completedItems.length > 0).length,
      totalItems: userProgress.reduce((sum, p) => sum + p.completedItems.length, 0),
      completedItems: userProgress.reduce((sum, p) => sum + p.completedItems.length, 0)
    };
  }

  // Работа с назначениями чек-листов
  getAssignments(): ChecklistAssignment[] {
    const assignments = localStorage.getItem(this.ASSIGNMENTS_KEY);
    return assignments ? JSON.parse(assignments) : [];
  }

  saveAssignment(assignment: ChecklistAssignment): void {
    const allAssignments = this.getAssignments();
    const existingIndex = allAssignments.findIndex(a => a.id === assignment.id);
    
    if (existingIndex >= 0) {
      allAssignments[existingIndex] = assignment;
    } else {
      allAssignments.push(assignment);
    }
    
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(allAssignments));
  }

  getUserAssignments(userId: string): ChecklistAssignment[] {
    const allAssignments = this.getAssignments();
    return allAssignments.filter(a => a.userId === userId);
  }

  assignChecklistToUser(userId: string, checklistId: string, assignedBy: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string, notes?: string): { success: boolean; message: string } {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Пользователь не найден' };
    }

    const assignment: ChecklistAssignment = {
      id: `assignment-${Date.now()}`,
      userId,
      checklistId,
      assignedBy,
      assignedAt: new Date().toISOString(),
      priority,
      dueDate,
      notes
    };

    this.saveAssignment(assignment);
    return { success: true, message: 'Чек-лист успешно назначен пользователю' };
  }

  removeAssignment(assignmentId: string): { success: boolean; message: string } {
    const allAssignments = this.getAssignments();
    const filteredAssignments = allAssignments.filter(a => a.id !== assignmentId);
    
    if (filteredAssignments.length === allAssignments.length) {
      return { success: false, message: 'Назначение не найдено' };
    }
    
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(filteredAssignments));
    return { success: true, message: 'Назначение удалено' };
  }

  // Админские функции
  isAdmin(userId: string): boolean {
    const user = this.getUsers().find(u => u.id === userId);
    return user?.role === 'admin';
  }

  deleteUser(userId: string, adminId: string): { success: boolean; message: string } {
    if (!this.isAdmin(adminId)) {
      return { success: false, message: 'Недостаточно прав для удаления пользователя' };
    }

    const users = this.getUsers();
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) {
      return { success: false, message: 'Пользователь не найден' };
    }

    if (userToDelete.role === 'admin') {
      return { success: false, message: 'Нельзя удалить администратора' };
    }

    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(filteredUsers));

    // Удаляем связанные данные
    const filteredProgress = this.getProgress().filter(p => p.userId !== userId);
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(filteredProgress));

    const filteredAssignments = this.getAssignments().filter(a => a.userId !== userId);
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(filteredAssignments));

    return { success: true, message: 'Пользователь удален' };
  }

  // Очистка данных (для разработки)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
    localStorage.removeItem(this.ASSIGNMENTS_KEY);
    this.initializeDatabase();
  }

  // Экспорт данных
  exportData(): { users: User[]; progress: ChecklistProgress[]; assignments: ChecklistAssignment[] } {
    return {
      users: this.getUsers(),
      progress: this.getProgress(),
      assignments: this.getAssignments()
    };
  }

  // Импорт данных
  importData(data: { users: User[]; progress: ChecklistProgress[]; assignments: ChecklistAssignment[] }): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(data.users));
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(data.progress));
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(data.assignments));
  }
}

export const database = new DatabaseService();
export default database;