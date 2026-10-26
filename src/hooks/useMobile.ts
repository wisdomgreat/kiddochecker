
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on initial render
    checkSize();
    
    // Set up event listener for resize events
    window.addEventListener('resize', checkSize);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}

