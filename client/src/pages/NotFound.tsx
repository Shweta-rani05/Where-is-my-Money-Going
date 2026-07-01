import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70svh] flex flex-col justify-center items-center text-center px-4">
      <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary font-bold text-4xl mb-6 select-none animate-pulse">
        404
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-text-muted max-w-md mb-8 text-sm">
        Oops! The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-opacity-90 shadow-md transition-all duration-200"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
