import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Skeleton from '../ui/Skeleton';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 animate-pulse mx-auto flex items-center justify-center text-white font-bold">
            SF
          </div>
          <p className="text-xs text-slate-500">Đang xác thực phiên làm việc...</p>
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

