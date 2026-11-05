import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { UserPlus, Edit2, QrCode, User, Calendar } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AddEditChildDialog from "@/components/children/AddEditChildDialog";
import QRCodeModal from "./QRCodeModal";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_class_name?: string;
  is_present?: boolean;
}

const ParentChildManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const queryClient = useQueryClient();

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['parent-my-children'] });
    queryClient.invalidateQueries({ queryKey: ['parent-children'] });
  };

  const { data: children = [], isLoading, refetch } = useQuery({
    queryKey: ['parent-my-children', user?.id],
    queryFn: async (): Promise<Child[]> => {
      if (!user?.id) return [];

      let fetchedChildren: Child[] = [];

      // 1. Primary: RPC get_parent_children_with_classes (supports Azure AD UID, parent email, class info)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_parent_children_with_classes', {
          parent_user_id: user.id
        });

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          fetchedChildren = rpcData.map((child: any) => ({
            id: child.child_id || child.id,
            first_name: child.first_name,
            last_name: child.last_name,
            age: child.age,
            allergies: child.allergies,
            medical_info: child.medical_info,
            emergency_contact_name: child.emergency_contact_name,
            emergency_contact_phone: child.emergency_contact_phone,
            current_class_name: child.current_class_name || 'General / Summer Camp',
            is_present: false,
          }));
        }
      } catch (rpcErr) {
        console.warn('Notice in get_parent_children_with_classes RPC, trying direct fallback:', rpcErr);
      }

      // 2. Direct query fallback if RPC returned nothing
      if (fetchedChildren.length === 0) {
        try {
          const { data: directData, error: directErr } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id)
            .order('first_name');

          if (!directErr && Array.isArray(directData) && directData.length > 0) {
            fetchedChildren = directData.map((child: any) => ({
              id: child.id,
              first_name: child.first_name,
              last_name: child.last_name,
              age: child.age,
              allergies: child.allergies,
              medical_info: child.medical_info,
              emergency_contact_name: child.emergency_contact_name,
              emergency_contact_phone: child.emergency_contact_phone,
              current_class_name: child.current_class_name || child.class_name || 'General / Summer Camp',
              is_present: false,
            }));
          }
        } catch (directErr) {
          console.warn('Direct query fallback error in ParentChildManagement:', directErr);
        }
      }

      // 3. Enrich with today attendance status non-blockingly
      if (fetchedChildren.length > 0) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('child_id, checked_in_at, checked_out_at')
            .eq('attendance_date', today);

          if (Array.isArray(attendanceData)) {
            const presentSet = new Set(
              attendanceData
                .filter((a: any) => a.checked_in_at && !a.checked_out_at)
                .map((a: any) => a.child_id)
            );
            fetchedChildren = fetchedChildren.map(c => ({
              ...c,
              is_present: presentSet.has(c.id),
            }));
          }
        } catch (attErr) {
          console.warn('Attendance presence check warning (non-fatal):', attErr);
        }
      }

      return fetchedChildren;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const childId = searchParams.get('child');
    if (childId && children.length > 0) {
      const child = children.find(c => c.id === childId);
      if (child) {
        setSelectedChild(child);
        setShowEditModal(true);
        // Clear param to avoid re-opening if page refreshed or navigated back
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, children, setSearchParams]);

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setShowEditModal(true);
  };

  const handleShowQR = (child: Child) => {
    setSelectedChild(child);
    setShowQRModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Children</h2>
          <p className="text-gray-600">Manage your children's information and attendance</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children registered</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first child.</p>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {children.map((child) => (
            <motion.div
              key={child.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {child.first_name?.[0]}{child.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">Age: {child.age}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditChild(child)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleShowQR(child)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={child.is_present ? "default" : "secondary"}>
                      {child.is_present ? "Present" : "Not Present"}
                    </Badge>
                  </div>

                  {child.current_class_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Class:</span>
                      <Badge variant="outline">{child.current_class_name}</Badge>
                    </div>
                  )}

                  {child.allergies && (
                    <div>
                      <span className="text-sm font-medium text-red-600">Allergies:</span>
                      <p className="text-sm text-red-600 mt-1">{child.allergies}</p>
                    </div>
                  )}

                  {child.emergency_contact_name && (
                    <div>
                      <span className="text-sm font-medium">Emergency Contact:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {child.emergency_contact_name}
                        {child.emergency_contact_phone && ` - ${child.emergency_contact_phone}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AddEditChildDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          handleRefresh();
        }}
      />

      <AddEditChildDialog
        open={showEditModal}
        onOpenChange={setShowEditModal}
        childId={selectedChild?.id}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedChild(null);
          handleRefresh();
        }}
      />

      <QRCodeModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        child={selectedChild}
      />
    </div>
  );
};

export default ParentChildManagement;
