
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bridge } from "@/lib/bridgeClient";
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
        // Using the new Bridge Client to fetch from Azure
        const { data, error } = await bridge
          .from('qr_codes')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error("Error fetching QR codes via Bridge:", error);
          return [];
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useQRCodes (Bridge):", error);
        return [];
      }
    },
  });

  const generateQRCodeMutation = useMutation({
    mutationFn: async (childId: string) => {
      const qrData = window.crypto.randomUUID();

      // For generation, we use an RPC if available, or update the bridge to support inserts
      // Assuming a database function 'generate_qr_code' exists or using the bridge
      const { data, error } = await bridge.rpc('generate_qr_code_rpc', {
        p_child_id: childId,
        p_qr_data: qrData
      });

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

