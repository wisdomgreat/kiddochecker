import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AddChildForm from "./AddChildForm";
import { UserPlus, RefreshCcw, Edit, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  allergies: string | null;
  medicalInfo: string | null;
}

const ChildrenManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from("children")
          .select(`
            id, 
            first_name, 
            last_name, 
            age, 
            allergies, 
            medical_info
          `)
          .eq("parent_id", user.id);

        if (error) {
          throw error;
        }

        return data.map((child) => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          age: child.age,
          allergies: child.allergies,
          medicalInfo: child.medical_info,
        }));
      } catch (error: any) {
        console.error("Error fetching children:", error);
        toast({
          title: "Error",
          description: "Failed to load children",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const handleDeleteChild = async () => {
    if (!selectedChild) return;
    
    try {
      const { error: relationshipError } = await supabase
        .from("parent_children")
        .delete()
        .eq("child_id", selectedChild.id);
      
      if (relationshipError) throw relationshipError;
      
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", selectedChild.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Child removed successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setIsDeleteDialogOpen(false);
      setSelectedChild(null);
    } catch (error: any) {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove child",
        variant: "destructive",
      });
    }
  };

  const childColumns = [
    {
      key: "firstName" as const,
      header: "Name",
      render: (value: string, child: Child) => (
        <div>
          <div className="font-medium">{child.firstName} {child.lastName}</div>
          {child.age !== null && (
            <div className="text-xs text-gray-500">Age: {child.age}</div>
          )}
        </div>
      ),
    },
    {
      key: "medicalInfo" as const,
      header: "Health Info",
      render: (value: string | null, child: Child) => (
        <div className="space-y-1">
          {child.allergies && (
            <div className="text-sm">
              <span className="font-medium text-amber-600">Allergies:</span> {child.allergies}
            </div>
          )}
          {child.medicalInfo && (
            <div className="text-sm line-clamp-2">
              <span className="font-medium text-blue-600">Medical:</span> {child.medicalInfo}
            </div>
          )}
          {!child.allergies && !child.medicalInfo && (
            <div className="text-sm text-gray-500">No health info provided</div>
          )}
        </div>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, child: Child) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Edit functionality will be available soon",
              });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedChild(child);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Children</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Children</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading children...</span>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No children added yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your children to use the check-in system.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Child
                </Button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={childColumns}
              data={children}
              keyExtractor={(child) => child.id}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      <AddChildForm 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["children"] })}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedChild?.firstName} {selectedChild?.lastName} from your account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChild} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChildrenManagement;
