import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-background-custom text-text-custom">
      {/* Left Column: Form Area */}
      <div className="flex-1 flex flex-col justify-center relative p-8 sm:p-12 lg:p-24">
        {/* Theme Toggler */}
        <header className="absolute top-6 right-6 lg:top-8 lg:right-8 z-10">
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

        <main className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md mb-4">
              $
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              WhereIsMyMoney
            </h1>
            <p className="text-sm text-text-muted mt-2">
              Welcome back! Please enter your details.
            </p>
          </div>

          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AuthLayout;
