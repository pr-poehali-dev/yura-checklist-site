// Локальная база данных для имитации работы с БД
// В реальном проекте здесь будет подключение к настоящей базе данных

export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  lastLogin: string;
}

export interface ChecklistProgress {
  id: string;
  userId: string;
  checklistId: string;
  completedItems: string[];
  lastUpdated: string;
}

class DatabaseService {
  private USERS_KEY = 'business_checklists_users';
  private PROGRESS_KEY = 'business_checklists_progress';

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Создаем базового админа, если его нет
    const users = this.getUsers();
    if (!users.find(u => u.username === 'admin')) {
      const adminUser: User = {
        id: 'admin-1',
        username: 'admin',
        password: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      this.saveUser(adminUser);
    }
  }

  // Работа с пользователями
  getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
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

  registerUser(username: string, password: string): { success: boolean; message: string; user?: User } {
    if (this.findUserByUsername(username)) {
      return { success: false, message: 'Пользователь с таким логином уже существует' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
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

  // Очистка данных (для разработки)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
    this.initializeDatabase();
  }

  // Экспорт данных
  exportData(): { users: User[]; progress: ChecklistProgress[] } {
    return {
      users: this.getUsers(),
      progress: this.getProgress()
    };
  }

  // Импорт данных
  importData(data: { users: User[]; progress: ChecklistProgress[] }): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(data.users));
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(data.progress));
  }
}

export const database = new DatabaseService();
export default database;