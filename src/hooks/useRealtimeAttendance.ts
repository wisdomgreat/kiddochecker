
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAttendance } from './useAttendance';

export const useRealtimeAttendance = () => {
  const { attendance, refetch } = useAttendance();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Real-time attendance update:', payload);
          // Refetch attendance data when changes occur
          refetch();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    attendance,
    isConnected,
  };
};
