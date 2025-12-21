
import React from 'react';
import { Link2, Settings, LogOut, LayoutGrid } from 'lucide-react';
import { ViewType } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { logout } = useAuth();
  
  const menuItems = [
    { id: 'mappings', label: 'Зв’язки', icon: Link2 },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-8">
          <LayoutGrid size={28} />
          <span>СинхроАдмін</span>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Вихід
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
