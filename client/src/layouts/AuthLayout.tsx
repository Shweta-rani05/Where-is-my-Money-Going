import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-background-custom text-text-custom">
      {/* Form Area */}
      <div className="flex-1 flex flex-col justify-center relative p-8 sm:p-12 lg:p-24">
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
