
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Link2, Settings, LogOut, LayoutGrid, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  
  const menuItems = [
    { id: 'mappings', label: 'Зв’язки', icon: Link2, path: '/' },
    { id: 'history', label: 'Історія', icon: History, path: '/history' },
    { id: 'settings', label: 'Налаштування', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-8">
          <LayoutGrid size={28} />
          <span>СинхроАдмін</span>
        </Link>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
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
