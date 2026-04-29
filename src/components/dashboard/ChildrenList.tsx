
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/CleanAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddChildForm from "@/components/children/AddChildForm";
import { Plus, UserRound, Calendar, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  allergies?: string;
}

const ChildrenList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch children data
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
          firstName: child.first_name,
          lastName: child.last_name,
          age: child.age,
          allergies: child.allergies,
        }));
      } catch (error) {
        console.error("Error fetching children:", error);
        toast({
          title: "Error",
          description: "Failed to load children data",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Children</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus size={16} className="mr-1" /> Add Child
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <UserRound size={48} className="mx-auto text-gray-400 mb-2" />
              <h3 className="font-medium text-lg">No children added yet</h3>
              <p className="text-gray-500 mb-4">Add your children to check them in and out.</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus size={16} className="mr-1" /> Add Your First Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          children.map(child => (
            <Card key={child.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between">
                  <span>{child.firstName} {child.lastName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1" />
                  <span>Age: {child.age}</span>
                </div>
                {child.allergies && (
                  <div className="flex items-center text-sm text-red-600">
                    <Info size={14} className="mr-1" />
                    <span>Allergies: {child.allergies}</span>
                  </div>
                )}
                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddChildForm 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={() => {
          refetch();
        }} 
      />
    </div>
  );
};

export default ChildrenList;

