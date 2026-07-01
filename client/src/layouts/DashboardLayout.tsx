import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Wallet,
  Bot,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const DashboardLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Savings Goals', path: '/goals', icon: PiggyBank },
    { name: 'AI Chat', path: '/ai-chat', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  // Extract page title from path
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'Financial Manager';
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-background-custom text-text-custom">
      
      {/* 1. Backdrop for mobile sidebar */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* 2. Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-border-custom bg-card-custom transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-custom">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              $
            </div>
            <span className="font-bold text-lg tracking-tight">WhereIsMyMoney</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-md hover:bg-border-custom/50 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-custom hover:bg-border-custom/30'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-custom">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 3. Main Page Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border-custom bg-card-custom/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg border border-border-custom lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight leading-none">
              {getPageTitle()}
            </h2>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border-custom hover:bg-border-custom/30 transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-text-custom" />
              ) : (
                <Sun className="w-4 h-4 text-text-custom" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 border-l border-border-custom pl-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs select-none">
                {user?.name ? (
                  user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-semibold hidden md:inline-block">{user?.name || 'User'}</span>
            </div>

          </div>
        </header>

        {/* Main Route Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
