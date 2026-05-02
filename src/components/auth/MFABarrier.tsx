import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MFABarrierProps {
  children: React.ReactNode;
}

/**
 * MFABarrier - Now a simple pass-through since Microsoft Entra handles MFA internally.
 * This remains in place to maintain component hierarchy and future flexibility.
 */
const MFABarrier = ({ children }: MFABarrierProps) => {
  const { isMfaPending } = useAuth();

  // If for some reason we need a custom barrier in the future, we can add it here.
  // For now, Microsoft handles the security gates.
  if (isMfaPending) {
    return null; // Should not happen with MSAL
  }

  return <>{children}</>;
};

export default MFABarrier;
