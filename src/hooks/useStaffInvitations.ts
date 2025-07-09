
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StaffInvitation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: 'pending' | 'completed' | 'expired';
  invitation_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_id?: string;
}

export const useStaffInvitations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ["staff-invitations"],
    queryFn: async () => {
      console.log("Fetching staff invitations...");
      
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching invitations:", error);
        throw error;
      }
      
      console.log("Invitations data received:", data);
      return (data || []) as StaffInvitation[];
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log("Resending invitation:", invitationId);
      
      // Update the invitation with a new token and expiry
      const { error } = await supabase
        .from('staff_invitations')
        .update({
          invitation_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .eq('id', invitationId);

      if (error) throw error;
      
      return invitationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invitations"] });
      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    resendInvitation: resendInvitationMutation.mutate,
    isResending: resendInvitationMutation.isPending,
  };
};
