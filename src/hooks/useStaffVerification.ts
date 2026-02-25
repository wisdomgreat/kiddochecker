import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface StaffDocument {
    id: string;
    user_id: string;
    document_type: string;
    document_name: string;
    file_path: string | null;
    file_size: number | null;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    uploaded_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    rejection_reason: string | null;
    expires_at: string | null;
}

export interface DocumentRequirement {
    id: string;
    document_type: string;
    display_name: string;
    description: string | null;
    required_for_roles: string[];
    is_mandatory: boolean;
    has_expiry: boolean;
    expiry_months: number | null;
}

export interface PendingVerification {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    verification_status: string;
    created_at: string;
    documents_submitted: number;
    documents_approved: number;
    documents_pending: number;
}

export const useStaffVerification = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Get current user's verification status
    const verificationStatusQuery = useQuery({
        queryKey: ["staff-verification-status", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase.rpc('get_staff_verification_status', {
                p_user_id: user.id
            });
            if (error) {
                console.error("Error fetching verification status:", error);
                return null;
            }
            return data?.[0] || null;
        },
        enabled: !!user?.id,
    });

    // Get document requirements
    const requirementsQuery = useQuery({
        queryKey: ["document-requirements"],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from('document_requirements' as any) as any)
                .select('*')
                .order('is_mandatory', { ascending: false });
            if (error) {
                console.error("Error fetching requirements:", error);
                return [];
            }
            return (data || []) as DocumentRequirement[];
        },
    });

    // Get user's own documents
    const myDocumentsQuery = useQuery({
        queryKey: ["my-staff-documents", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await (supabase
                .from('staff_documents' as any) as any)
                .select('*')
                .eq('user_id', user.id)
                .order('uploaded_at', { ascending: false });
            if (error) {
                console.error("Error fetching documents:", error);
                return [];
            }
            return (data || []) as StaffDocument[];
        },
        enabled: !!user?.id,
    });

    // Get all pending staff verifications (admin only)
    const pendingVerificationsQuery = useQuery({
        queryKey: ["pending-staff-verifications"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_pending_staff_verifications');
            if (error) {
                console.error("Error fetching pending verifications:", error);
                return [];
            }
            return (data || []) as unknown as PendingVerification[];
        },
    });

    // Get documents for a specific user (admin review)
    const getDocumentsForUser = async (userId: string): Promise<StaffDocument[]> => {
        const { data, error } = await (supabase
            .from('staff_documents' as any) as any)
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });
        if (error) {
            console.error("Error fetching user documents:", error);
            return [];
        }
        return (data || []) as StaffDocument[];
    };

    // Upload a document
    const uploadDocumentMutation = useMutation({
        mutationFn: async ({ file, documentType, description }: {
            file: File;
            documentType: string;
            description?: string;
        }) => {
            if (!user?.id) throw new Error("Not authenticated");

            // Upload file to storage
            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('staff-documents')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                throw new Error(`File upload failed: ${uploadError.message}`);
            }

            // Create document record
            const { data, error } = await (supabase
                .from('staff_documents' as any) as any)
                .insert({
                    user_id: user.id,
                    document_type: documentType,
                    document_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    description: description || null,
                    status: 'pending',
                } as any)
                .select()
                .single();

            if (error) throw error;

            // Update user verification status to 'pending' if currently 'unverified'
            await (supabase
                .from('user_roles' as any) as any)
                .update({ verification_status: 'pending' } as any)
                .eq('user_id', user.id)
                .eq('verification_status', 'unverified');

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-staff-documents"] });
            queryClient.invalidateQueries({ queryKey: ["staff-verification-status"] });
            toast({
                title: "Document Uploaded",
                description: "Your document has been submitted for review.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload document.",
                variant: "destructive",
            });
        },
    });

    // Admin: approve a document
    const approveDocumentMutation = useMutation({
        mutationFn: async (documentId: string) => {
            const { error } = await (supabase
                .from('staff_documents' as any) as any)
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user?.id,
                } as any)
                .eq('id', documentId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pending-staff-verifications"] });
            queryClient.invalidateQueries({ queryKey: ["my-staff-documents"] });
            toast({ title: "Document Approved", description: "The document has been approved." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Admin: reject a document
    const rejectDocumentMutation = useMutation({
        mutationFn: async ({ documentId, reason }: { documentId: string; reason: string }) => {
            const { error } = await (supabase
                .from('staff_documents' as any) as any)
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user?.id,
                    rejection_reason: reason,
                } as any)
                .eq('id', documentId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pending-staff-verifications"] });
            queryClient.invalidateQueries({ queryKey: ["my-staff-documents"] });
            toast({ title: "Document Rejected", description: "Feedback has been sent to the staff member." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Admin: approve or reject a staff member's overall verification
    const verifyStaffMutation = useMutation({
        mutationFn: async ({ userId, action, notes }: {
            userId: string;
            action: 'approve' | 'reject';
            notes?: string;
        }) => {
            const { data, error } = await supabase.rpc('admin_verify_staff', {
                p_user_id: userId,
                p_action: action,
                p_notes: notes || null,
            });
            if (error) throw error;
            const res = data as any;
            if (!res?.success) throw new Error(res?.error || 'Verification failed');
            return res;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["pending-staff-verifications"] });
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast({
                title: variables.action === 'approve' ? "Staff Verified" : "Staff Rejected",
                description: variables.action === 'approve'
                    ? "The staff member now has full access to the platform."
                    : "The staff member has been notified of the rejection.",
            });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Get download URL for a document
    const getDocumentUrl = async (filePath: string): Promise<string | null> => {
        const { data } = await supabase.storage
            .from('staff-documents')
            .createSignedUrl(filePath, 3600); // 1 hour
        return data?.signedUrl || null;
    };

    return {
        // Status
        verificationStatus: verificationStatusQuery.data,
        isLoadingStatus: verificationStatusQuery.isLoading,

        // Requirements
        requirements: requirementsQuery.data || [],
        isLoadingRequirements: requirementsQuery.isLoading,

        // My documents
        myDocuments: myDocumentsQuery.data || [],
        isLoadingDocuments: myDocumentsQuery.isLoading,

        // Admin: pending verifications
        pendingVerifications: pendingVerificationsQuery.data || [],
        isLoadingPending: pendingVerificationsQuery.isLoading,

        // Actions
        uploadDocument: uploadDocumentMutation.mutate,
        isUploading: uploadDocumentMutation.isPending,
        approveDocument: approveDocumentMutation.mutate,
        rejectDocument: rejectDocumentMutation.mutate,
        verifyStaff: verifyStaffMutation.mutate,
        isVerifying: verifyStaffMutation.isPending,

        // Helpers
        getDocumentsForUser,
        getDocumentUrl,
    };
};
