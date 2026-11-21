import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import CurrencySelector from '../components/CurrencySelector';
import {
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
  ChevronDown,
  Bot,
  Landmark,
  Target,
  FileSpreadsheet
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
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
    { name: 'Overview', path: '/' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Budgets', path: '/budgets' },
    { name: 'Investments', path: '/investments', badge: 'Live' },
    { name: 'Recurring', path: '/recurring' },
    { name: 'Credit Score', path: '/credit-score' }
  ];

  const moreToolGroups = [
    {
      group: 'Accounts & Planning',
      links: [
        { name: 'Bank Feeds & Sync', desc: 'Direct banking integration', path: '/banks', icon: Landmark },
        { name: 'Savings Goals', desc: 'Vault targets & timelines', path: '/goals', icon: Target },
        { name: 'Statement OCR', desc: 'AI statement scanning', path: '/statements', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'AI Advisory',
      links: [
        { name: 'AI Insights', desc: 'Forecasts & anomaly alerts', path: '/ai-insights', icon: Sparkles },
        { name: 'AI Money Advisor', desc: 'Conversational assistant', path: '/ai-chat', icon: Bot }
      ]
    }
  ];

  const allMorePaths = moreToolGroups.flatMap((g) => g.links.map((l) => l.path));
  const isMoreActive = allMorePaths.some((p) => location.pathname === p);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 text-text-custom bg-background">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-border-custom bg-card-custom/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Mark & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-border-custom lg:hidden cursor-pointer hover:bg-border-custom/30 text-text-custom transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
                W
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight leading-tight">WhereIsMyMoney</span>
                <span className="text-[10px] text-text-muted leading-tight font-medium hidden sm:block">Financial OS</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 h-full">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `relative px-3.5 h-full flex items-center text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-text-muted hover:text-text-custom'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-1.5">
                      {link.name}
                      {link.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {link.badge}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Structured "More" Dropdown */}
            <div className="relative h-full flex items-center" ref={moreDropdownRef}>
              <button
                onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                className={`relative px-3.5 h-full flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
                  isMoreActive ? 'text-primary' : 'text-text-muted hover:text-text-custom'
                }`}
              >
                <span>Tools & AI</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreDropdownOpen ? 'rotate-180' : ''}`} />
                {isMoreActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                )}
              </button>

              {isMoreDropdownOpen && (
                <div className="absolute top-16 left-0 w-72 p-2 mt-1 bg-card-custom border border-border-custom rounded-2xl shadow-xl z-50">
                  {moreToolGroups.map((group, groupIdx) => (
                    <div key={group.group} className={groupIdx > 0 ? 'mt-2 pt-2 border-t border-border-custom/60' : ''}>
                      <span className="px-3 py-1 text-[11px] font-semibold text-text-muted tracking-tight block">
                        {group.group}
                      </span>
                      {group.links.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsMoreDropdownOpen(false)}
                          className={({ isActive }) =>
                            `flex items-start gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-custom hover:bg-border-custom/40'
                            }`
                          }
                        >
                          <link.icon className="w-4 h-4 mt-0.5 text-text-muted flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm leading-tight">{link.name}</div>
                            <div className="text-[11px] text-text-muted mt-0.5 leading-tight">{link.desc}</div>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 h-full">
            <CurrencySelector />
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative h-full flex items-center" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border-custom cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-semibold text-xs">
                  {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">{user?.name || 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden md:block" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute top-16 right-0 w-56 p-2 mt-1 bg-card-custom border border-border-custom rounded-2xl shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-border-custom mb-1">
                    <p className="text-sm font-semibold text-text-custom truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-custom hover:bg-border-custom/40 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    <span>Settings</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-border-custom bg-card-custom/95 backdrop-blur-md sticky top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-text-muted px-3 block">Main</span>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-muted hover:bg-border-custom/40 hover:text-text-custom'
                  }`
                }
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {moreToolGroups.map((group) => (
            <div key={group.group} className="space-y-1 pt-2 border-t border-border-custom/60">
              <span className="text-[11px] font-semibold text-text-muted px-3 block">{group.group}</span>
              {group.links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-muted hover:bg-border-custom/40 hover:text-text-custom'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Main Page Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;