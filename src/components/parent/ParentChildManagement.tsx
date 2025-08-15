
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit2, QrCode, User, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AddChildModal from "./AddChildModal";
import EditChildModal from "./EditChildModal";
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

  const { data: children = [], isLoading, refetch } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async (): Promise<Child[]> => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase.rpc('get_parent_children_with_classes', {
          parent_user_id: user.id
        });
        
        if (error) {
          console.error('Error fetching children:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in parent children fetch:', error);
        toast({
          title: 'Error',
          description: 'Failed to load children',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!user,
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="hover:shadow-md transition-shadow">
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
          ))}
        </div>
      )}

      <AddChildModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />

      <EditChildModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        child={selectedChild}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedChild(null);
          refetch();
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
