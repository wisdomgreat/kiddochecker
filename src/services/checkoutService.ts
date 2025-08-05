
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
  try {
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
    
    return (data || []).map(item => ({
      id: item.id,
      name: `${item.children.first_name} ${item.children.last_name}`,
      class: item.classes?.name || "Unknown Class",
      status: "Checked out",
      time: new Date(item.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      child_id: item.children.id,
      attendance_id: item.id
    }));
  } catch (error) {
    console.error("Exception in fetchRecentCheckouts:", error);
    return [];
  }
};

// Function to check out a child using the database function
export const checkoutChild = async (attendanceId: string, checkedOutBy?: string) => {
  try {
    console.log("Checking out child with attendance ID:", attendanceId);
    
    const { data, error } = await supabase.rpc('checkout_child' as any, {
      p_attendance_id: attendanceId,
      p_checked_out_by: checkedOutBy || null
    });
    
    if (error) {
      console.error("Checkout error:", error);
      throw error;
    }
    
    if (!data) {
      throw new Error("Child was already checked out or attendance record not found");
    }
    
    console.log("Child checked out successfully");
    return { success: true };
  } catch (error) {
    console.error("Exception in checkoutChild:", error);
    throw error;
  }
};

// Function to get children available for checkout
export const getChildrenForCheckout = async (): Promise<CheckoutItem[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        checked_in_at,
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
      .is('checked_out_at', null)
      .order('checked_in_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching children for checkout:", error);
      throw error;
    }
    
    return (data || []).map(item => ({
      id: item.id,
      name: `${item.children.first_name} ${item.children.last_name}`,
      class: item.classes?.name || "No Class Assigned",
      status: "Checked in",
      time: new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      child_id: item.children.id,
      attendance_id: item.id
    }));
  } catch (error) {
    console.error("Exception in getChildrenForCheckout:", error);
    return [];
  }
};
