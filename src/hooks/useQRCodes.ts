
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

export interface QRCode {
  id: string;
  child_id: string;
  qr_data: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  child?: {
    first_name: string;
    last_name: string;
  };
}

export const useQRCodes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qrCodes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["qr-codes"],
    queryFn: async (): Promise<QRCode[]> => {
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select(`
            *,
            child:children(first_name, last_name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching QR codes:", error);
          return [];
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useQRCodes:", error);
        return [];
      }
    },
  });

  const generateQRCodeMutation = useMutation({
    mutationFn: async (childId: string) => {
      const qrData = window.crypto.randomUUID();

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          child_id: childId,
          qr_data: qrData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    },
  });

  return {
    qrCodes,
    isLoading,
    error,
    refetch,
    generateQRCode: generateQRCodeMutation.mutate,
    isGenerating: generateQRCodeMutation.isPending,
  };
};

export default useQRCodes;

