import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative transition-colors duration-300 bg-background-custom text-text-custom">
      {/* Theme Toggler Header */}
      <header className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full border border-border-custom bg-card-custom hover:bg-border-custom/20 transition-all shadow-sm focus:outline-none cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-text-custom" />
          ) : (
            <Sun className="w-5 h-5 text-text-custom" />
          )}
        </button>
      </header>

      {/* Main Card Container */}
      <main className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md mb-3">
            $
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-center">
            Where Is My Money Going?
          </h1>
          <p className="text-sm text-text-muted text-center mt-1">
            AI-powered personal finance management
          </p>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
