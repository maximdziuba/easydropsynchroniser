import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MappingModal from './components/MappingModal';
import { ProductConnection, ViewType, AppSettings } from './types';
import { api } from './api';
import { Plus, Search, Link2, Settings as SettingsIcon, Save, Clock, Trash2, Info, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

const Dashboard: React.FC = () => {
  const [view, setView] = useState<ViewType>('mappings');
  const [connections, setConnections] = useState<ProductConnection[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ sync_interval: 10 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load initial data
  useEffect(() => {
    loadMappings();
  }, []);

  useEffect(() => {
    if (view === 'settings') {
      loadSettings();
    }
  }, [view]);

  const loadMappings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMappings();
      setConnections(data);
    } catch (e) {
      console.error("Failed to load mappings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const filteredConnections = connections.filter(
    (c) =>
      c.source_id.toString().includes(searchQuery) ||
      c.target_id.toString().includes(searchQuery) ||
      (c.product_name && c.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddConnection = async (data: { sourceId: string; targetId: string; productName: string }) => {
    try {
      const newMapping = await api.createMapping({
        source_id: parseInt(data.sourceId),
        target_id: parseInt(data.targetId),
        product_name: data.productName
      });
      setConnections([...connections, newMapping]);
      setIsModalOpen(false);
    } catch (e) {
      alert("Failed to create connection");
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей зв’язок?')) {
      try {
        await api.deleteMapping(id);
        setConnections(connections.filter(c => c.id !== id));
      } catch (e) {
        alert("Failed to delete connection");
        console.error(e);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      alert('Налаштування збережено!');
    } catch (e) {
      alert("Failed to save settings");
      console.error(e);
    }
  };

  const handleRunSync = async () => {
      try {
          const res = await api.runSync();
          alert(res.message);
      } catch (e) {
          alert("Failed to trigger sync");
          console.error(e);
      }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Нові паролі не співпадають' });
      return;
    }
    
    try {
      await api.changePassword({ 
        old_password: passwordData.oldPassword, 
        new_password: passwordData.newPassword 
      });
      setPasswordMessage({ type: 'success', text: 'Пароль успішно змінено' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Не вдалося змінити пароль. Перевірте старий пароль.';
      setPasswordMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'mappings' ? 'Зв’язки товарів' : 'Налаштування системи'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {view === 'mappings' 
                ? 'Керування відповідністю ідентифікаторів між двома CRM.' 
                : 'Конфігурація автоматичної синхронізації та параметрів доступу.'}
            </p>
          </div>

          {view === 'mappings' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Plus size={18} />
              Додати зв’язок
            </button>
          )}
        </header>

        {view === 'mappings' ? (
          <div className="space-y-6">
            <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Пошук за ID або назвою..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm shadow-sm transition-all"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Товар</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID Джерела (Source)</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Цільовий ID (Target)</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredConnections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{conn.product_name || "Без назви"}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tight">
                            Створено: {conn.created_at ? new Date(conn.created_at).toLocaleDateString('uk-UA') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                            {conn.source_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                            {conn.target_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(conn.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Видалити зв’язок"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && filteredConnections.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Link2 size={40} className="mb-2 text-gray-400" />
                            <p className="text-sm font-medium text-gray-500">Зв’язків не знайдено</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl space-y-8">
            {/* Sync Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Частота синхронізації</h3>
                </div>
                
                <div className="space-y-4 ml-10">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Інтервал автоматичного оновлення (хвилини)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={settings.sync_interval}
                        onChange={(e) => setSettings({ ...settings, sync_interval: parseInt(e.target.value) || 0 })}
                        className="w-32 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
                      />
                      <span className="text-gray-500 text-sm font-medium">хвилин</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Система автоматично перевірятиме наявність змін у джерелі кожні <strong>{settings.sync_interval}</strong> хв.
                      Менший інтервал збільшує навантаження на API.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  <Save size={18} />
                  Зберегти налаштування
                </button>
              </div>
            </form>
            </div>

            {/* Manual Sync */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <RefreshCw size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Ручний запуск</h3>
                </div>
                <div className="ml-10">
                    <p className="text-sm text-gray-600 mb-4">
                        Ви можете примусово запустити процес синхронізації прямо зараз, не чекаючи розкладу.
                    </p>
                     <button
                        onClick={handleRunSync}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all active:scale-95"
                    >
                        <RefreshCw size={16} />
                        Запустити синхронізацію зараз
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Безпека</h3>
                </div>

                <div className="space-y-4 ml-10 max-w-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Старий пароль</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                         {showOldPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Новий пароль</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                         {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Підтвердіть новий пароль</label>
                     <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                         {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                      </button>
                    </div>
                  </div>

                  {passwordMessage.text && (
                    <div className={`text-sm font-medium ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-bold text-white bg-gray-800 rounded-lg hover:bg-gray-900 shadow-lg shadow-gray-200 transition-all active:scale-95"
                    >
                      Змінити пароль
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <MappingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleAddConnection}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
            </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
