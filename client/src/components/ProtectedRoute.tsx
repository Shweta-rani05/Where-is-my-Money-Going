import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route protection wrapper.
 * Intercepts requests for authenticated dashboard views, rendering a spinner
 * if token checks are pending, or navigating to /login if unauthenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background-custom text-text-custom">
        <div className="flex flex-col items-center gap-3">
          {/* Animated custom theme spinner */}
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-text-muted font-medium tracking-wide">
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children or fallback to nested route Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
