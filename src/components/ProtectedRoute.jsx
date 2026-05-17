import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/5" />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
