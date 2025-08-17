import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/CleanAuthContext";
import { Plus, Users, Baby } from "lucide-react";
import AddEditChildDialog from "./AddEditChildDialog";
import ChildCard from "./ChildCard";

interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const ChildrenManagement = () => {
  const { user } = useAuth();
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);

  const { data: children = [], isLoading, refetch } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data: parentChildrenData, error: parentChildrenError } = await supabase
          .from('parent_children')
          .select('child_id')
          .eq('parent_id', user.id);

        if (parentChildrenError) throw parentChildrenError;

        if (!parentChildrenData || parentChildrenData.length === 0) {
          return [];
        }

        const childIds = parentChildrenData.map(pc => pc.child_id);

        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .in('id', childIds);

        if (childrenError) throw childrenError;

        return (childrenData || []).map(child => ({
          id: child.id,
          parent_id: child.parent_id,
          first_name: child.first_name,
          last_name: child.last_name,
          age: child.age,
          allergies: child.allergies,
          medical_info: child.medical_info,
          emergency_contact_name: child.emergency_contact_name,
          emergency_contact_phone: child.emergency_contact_phone,
          notes: child.notes,
          created_at: child.created_at,
          updated_at: child.updated_at,
        }));
      } catch (error) {
        console.error("Error fetching children:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Children</h2>
        <Button onClick={() => setIsAddChildOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Child
        </Button>
      </div>

      {isLoading ? (
        <Card className="col-span-full">
          <CardContent className="p-6 flex justify-center items-center">
            <div className="animate-pulse text-center">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      ) : children.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-2" />
            <h3 className="font-medium text-lg">No children added yet</h3>
            <p className="text-gray-500 mb-4">Add your children to manage them.</p>
            <Button onClick={() => setIsAddChildOpen(true)}>
              <Plus size={16} className="mr-2" /> Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map(child => (
            <ChildCard key={child.id} child={child} onUpdate={refetch} />
          ))}
        </div>
      )}

      <AddEditChildDialog
        open={isAddChildOpen}
        onOpenChange={setIsAddChildOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default ChildrenManagement;
