import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0F2942] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h2 className="text-lg font-display font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your current role ({user.role}) does not have permission to view this dashboard. Contact a
          hospital administrator or routing manager for access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
