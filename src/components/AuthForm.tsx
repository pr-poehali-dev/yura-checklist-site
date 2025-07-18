import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { database, User } from '@/services/database';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState('login');
  
  // Вход
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Регистрация
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    // Имитация запроса к серверу
    setTimeout(() => {
      const user = database.authenticateUser(loginUsername, loginPassword);
      if (user) {
        onLogin(user);
      } else {
        setLoginError('Неверный логин или пароль');
      }
      setLoginLoading(false);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Пароли не совпадают');
      setRegisterLoading(false);
      return;
    }

    if (registerPassword.length < 3) {
      setRegisterError('Пароль должен содержать минимум 3 символа');
      setRegisterLoading(false);
      return;
    }

    // Имитация запроса к серверу
    setTimeout(() => {
      const result = database.registerUser(registerUsername, registerPassword);
      if (result.success) {
        setRegisterSuccess('Регистрация прошла успешно! Теперь вы можете войти.');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        setTimeout(() => {
          setActiveTab('login');
          setRegisterSuccess('');
        }, 2000);
      } else {
        setRegisterError(result.message);
      }
      setRegisterLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Icon name="ClipboardList" size={48} className="text-primary" />
          </div>
          <CardTitle className="text-2xl">Business Checklists</CardTitle>
          <CardDescription>
            Войдите в систему или создайте новый аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Логин</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Введите логин"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Введите пароль"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {loginError && (
                  <Alert variant="destructive">
                    <Icon name="AlertCircle" size={16} />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Вход...
                    </>
                  ) : (
                    <>
                      <Icon name="LogIn" size={16} className="mr-2" />
                      Войти
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Тестовый аккаунт:</strong><br />
                  Логин: admin • Пароль: admin
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Логин</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Придумайте логин"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Придумайте пароль"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Подтверждение пароля</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Повторите пароль"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {registerError && (
                  <Alert variant="destructive">
                    <Icon name="AlertCircle" size={16} />
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}
                {registerSuccess && (
                  <Alert>
                    <Icon name="CheckCircle" size={16} />
                    <AlertDescription>{registerSuccess}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <Icon name="UserPlus" size={16} className="mr-2" />
                      Зарегистрироваться
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;