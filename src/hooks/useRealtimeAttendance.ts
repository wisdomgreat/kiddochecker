
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  child_id: string;
  class_id?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  attendance_date: string;
}

interface UseRealtimeAttendanceOptions {
  onCheckIn?: (record: AttendanceRecord) => void;
  onCheckOut?: (record: AttendanceRecord) => void;
  onUpdate?: (record: AttendanceRecord) => void;
  enabled?: boolean;
}

export function useRealtimeAttendance(options: UseRealtimeAttendanceOptions = {}) {
  const { onCheckIn, onCheckOut, onUpdate, enabled = true } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayCount, setTodayCount] = useState({
    checkedIn: 0,
    checkedOut: 0,
  });

  // Fetch initial attendance data
  useEffect(() => {
    if (!enabled) return;

    const fetchAttendanceData = async () => {
      setLoading(true);
      
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get all attendance records for today
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('attendance_date', today)
          .order('checked_in_at', { ascending: false });
          
        if (error) throw error;
        
        setAttendanceRecords(data);
        
        // Calculate counts
        const checkedIn = data.length;
        const checkedOut = data.filter(record => record.checked_out_at).length;
        
        setTodayCount({
          checkedIn,
          checkedOut,
        });
        
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [enabled]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enabled) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Subscribe to attendance changes
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `attendance_date=eq.${today}`,
        },
        (payload) => {
          const newRecord = payload.new as AttendanceRecord;
          
          // Update state
          setAttendanceRecords(prev => [newRecord, ...prev]);
          setTodayCount(prev => ({
            ...prev,
            checkedIn: prev.checkedIn + 1,
          }));
          
          if (onCheckIn) onCheckIn(newRecord);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance',
          filter: `attendance_date=eq.${today}`,
        },
        (payload) => {
          const updatedRecord = payload.new as AttendanceRecord;
          
          // Check if this is a check-out event (checked_out_at was previously null but now has a value)
          if (payload.old && payload.old.checked_out_at === null && updatedRecord.checked_out_at) {
            setTodayCount(prev => ({
              ...prev,
              checkedOut: prev.checkedOut + 1,
            }));
            
            if (onCheckOut) onCheckOut(updatedRecord);
          }
          
          // Update the record in state
          setAttendanceRecords(prev => 
            prev.map(record => 
              record.id === updatedRecord.id ? updatedRecord : record
            )
          );
          
          if (onUpdate) onUpdate(updatedRecord);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onCheckIn, onCheckOut, onUpdate]);

  return {
    attendanceRecords,
    todayCount,
    loading,
    error,
    refreshData: async () => {
      setLoading(true);
      
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get all attendance records for today
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('attendance_date', today)
          .order('checked_in_at', { ascending: false });
          
        if (error) throw error;
        
        setAttendanceRecords(data);
        
        // Calculate counts
        const checkedIn = data.length;
        const checkedOut = data.filter(record => record.checked_out_at).length;
        
        setTodayCount({
          checkedIn,
          checkedOut,
        });
        
      } catch (err) {
        console.error("Error refreshing attendance data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
  };
}
