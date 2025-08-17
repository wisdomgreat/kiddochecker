import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/CleanAuthContext";
import LoginForm from "@/components/check-in/LoginForm";

const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginForm onSignUp={() => {}} />
    </div>
  );
};

export default LoginPage;
