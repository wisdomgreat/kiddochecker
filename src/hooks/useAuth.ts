
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

/**
 * useAuth - Custom hook to access authentication state and methods.
 * Separated from AuthContext.tsx to resolve Vite Fast Refresh (HMR) 
 * compatibility issues caused by exporting both a component and a hook.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
