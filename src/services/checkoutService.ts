
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutItem {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
  child_id: string;
  attendance_id: string;
}

// Function to fetch recent checkouts
export const fetchRecentCheckouts = async (): Promise<CheckoutItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      checked_in_at,
      checked_out_at,
      children (
        id,
        first_name,
        last_name
      ),
      classes (
        name
      )
    `)
    .eq('attendance_date', today)
    .not('checked_out_at', 'is', null)
    .order('checked_out_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Error fetching recent checkouts:", error);
    throw error;
  }
  
  return data.map(item => ({
    id: item.id,
    name: `${item.children.first_name} ${item.children.last_name}`,
    class: item.classes?.name || "Unknown Class",
    status: "Checked out",
    time: new Date(item.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    child_id: item.children.id,
    attendance_id: item.id
  }));
};

// Function to check out a child
export const checkoutChild = async (attendanceId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .update({
      checked_out_at: new Date().toISOString(),
      checked_out_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', attendanceId)
    .select();
    
  if (error) throw error;
  return data;
};
