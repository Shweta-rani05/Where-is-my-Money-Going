import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Sparkles,
  ChevronDown,
  Bot
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Budgets', path: '/budgets' },
    { name: 'Savings Goals', path: '/goals' },
    { name: 'Statement Analytics', path: '/statements' }
  ];

  const moreLinks = [
    { name: 'AI Chat', path: '/ai-chat', icon: Bot },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles }
  ];

  const isMoreActive = moreLinks.some(link => location.pathname === link.path);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 text-text-custom">
      {/* Top Navbar Header */}
      <header className="h-16 border-b border-border-custom bg-card-custom/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-border-custom lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                $
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">WhereIsMyMoney</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 h-full">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `relative px-4 h-full flex items-center text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-text-muted hover:text-text-custom'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* More Dropdown */}
            <div className="relative h-full flex items-center" ref={moreDropdownRef}>
              <button
                onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                className={`relative px-4 h-full flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
                  isMoreActive ? 'text-primary' : 'text-text-muted hover:text-text-custom'
                }`}
              >
                More
                <ChevronDown className="w-4 h-4" />
                {isMoreActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                )}
              </button>

              {isMoreDropdownOpen && (
                <div className="absolute top-16 left-0 w-56 py-2 mt-1 bg-card-custom border border-border-custom rounded-xl shadow-xl z-50">
                  {moreLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMoreDropdownOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-text-muted hover:bg-border-custom/50 hover:text-text-custom'
                        }`
                      }
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-4 h-full">
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

            {/* User Dropdown */}
            <div className="relative h-full flex items-center" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-border-custom cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-semibold hidden md:block">{user?.name || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-text-muted hidden md:block" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute top-16 right-0 w-48 py-2 mt-1 bg-card-custom border border-border-custom rounded-xl shadow-xl z-50">
                  <div className="px-4 py-2 border-b border-border-custom mb-2 block md:hidden">
                    <p className="text-sm font-medium text-text-custom truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-border-custom/50 hover:text-text-custom transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </NavLink>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-border-custom bg-card-custom/95 backdrop-blur-md absolute top-16 left-0 right-0 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col px-4 py-4 space-y-1">
            {[...navLinks, ...moreLinks].map((link) => {
              const Icon = 'icon' in link ? (link as any).icon as React.ElementType : null;
              return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-muted hover:bg-border-custom/50 hover:text-text-custom'
                  }`
                }
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{link.name}</span>
              </NavLink>
            )})}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
