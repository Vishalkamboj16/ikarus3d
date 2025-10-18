import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a loading screen while we check for a user
    return <div className="flex items-center justify-center h-screen text-2xl">Loading...</div>;
  }

  if (!user) {
    // If the user is not logged in, redirect them to the homepage.
    // We pass the original location in the state so we can redirect back.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If the user is logged in, render the component they were trying to access.
  return children;
};

export default ProtectedRoute;