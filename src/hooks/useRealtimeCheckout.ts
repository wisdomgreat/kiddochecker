import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeCheckout = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('checkout-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance',
          filter: 'checked_out_at=not.is.null'
        },
        (payload) => {
          console.log('Checkout detected:', payload);
          queryClient.invalidateQueries({ queryKey: ["present-children"] });
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('New check-in detected:', payload);
          queryClient.invalidateQueries({ queryKey: ["present-children"] });
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime checkout subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
