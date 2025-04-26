
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AddChildForm from "./AddChildForm";
import { 
  UserPlus, 
  RefreshCcw, 
  Edit, 
  Trash, 
  AlertTriangle, 
  Heart,
  HeartOff
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  allergies: string | null;
  medicalInfo: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hasGuardianApproval?: boolean;
  relationship?: string;
}

interface EditChildFormValues {
  firstName: string;
  lastName: string;
  age: string;
  allergies: string;
  medicalInfo: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  relationship: string;
}

const ChildrenManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Form for editing child
  const form = useForm<EditChildFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      age: "",
      allergies: "",
      medicalInfo: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      relationship: "parent",
    },
  });
  
  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Get children and relationship info
        const { data, error } = await supabase
          .from("parent_children")
          .select(`
            id,
            relationship,
            is_authorized_pickup,
            children:child_id (
              id, 
              first_name, 
              last_name, 
              age, 
              allergies, 
              medical_info,
              emergency_contact_name,
              emergency_contact_phone,
              has_guardian_approval
            )
          `)
          .eq("parent_id", user.id);

        if (error) {
          throw error;
        }
        
        // Transform the data to match the Child interface
        return data.map((item) => ({
          id: item.children.id,
          firstName: item.children.first_name,
          lastName: item.children.last_name,
          age: item.children.age,
          allergies: item.children.allergies,
          medicalInfo: item.children.medical_info,
          emergencyContactName: item.children.emergency_contact_name,
          emergencyContactPhone: item.children.emergency_contact_phone,
          hasGuardianApproval: item.children.has_guardian_approval,
          relationship: item.relationship,
          isAuthorizedPickup: item.is_authorized_pickup,
          relationshipId: item.id,
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

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      if (!selectedChild) return;
      
      // Delete the parent-child relationship
      const { error: relationshipError } = await supabase
        .from("parent_children")
        .delete()
        .eq("child_id", childId)
        .eq("parent_id", user?.id);
      
      if (relationshipError) throw relationshipError;
      
      // Delete the child record
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childId);
      
      if (error) throw error;
      
      return childId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Child removed successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setIsDeleteDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error: any) => {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove child",
        variant: "destructive",
      });
    }
  });
  
  // Update child mutation
  const updateChildMutation = useMutation({
    mutationFn: async (data: { childId: string, values: EditChildFormValues, relationshipId: string }) => {
      const { childId, values, relationshipId } = data;
      
      // Update child record
      const { error: childError } = await supabase
        .from("children")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          age: values.age ? parseInt(values.age) : null,
          allergies: values.allergies || null,
          medical_info: values.medicalInfo || null,
          emergency_contact_name: values.emergencyContactName || null,
          emergency_contact_phone: values.emergencyContactPhone || null,
        })
        .eq("id", childId);
      
      if (childError) throw childError;
      
      // Update relationship
      const { error: relationshipError } = await supabase
        .from("parent_children")
        .update({
          relationship: values.relationship,
        })
        .eq("id", relationshipId);
      
      if (relationshipError) throw relationshipError;
      
      return childId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Child information updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setIsEditDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error: any) => {
      console.error("Error updating child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update child information",
        variant: "destructive",
      });
    }
  });
  
  // Toggle guardian approval mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ childId, hasApproval }: { childId: string, hasApproval: boolean }) => {
      const { error } = await supabase
        .from("children")
        .update({
          has_guardian_approval: hasApproval,
        })
        .eq("id", childId);
      
      if (error) throw error;
      
      return { childId, hasApproval };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Guardian approval ${data.hasApproval ? 'granted' : 'revoked'} successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (error: any) => {
      console.error("Error toggling approval:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update guardian approval",
        variant: "destructive",
      });
    }
  });

  const handleDeleteChild = () => {
    if (selectedChild) {
      deleteChildMutation.mutate(selectedChild.id);
    }
  };

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    form.reset({
      firstName: child.firstName || "",
      lastName: child.lastName || "",
      age: child.age ? String(child.age) : "",
      allergies: child.allergies || "",
      medicalInfo: child.medicalInfo || "",
      emergencyContactName: child.emergencyContactName || "",
      emergencyContactPhone: child.emergencyContactPhone || "",
      relationship: child.relationship || "parent",
    });
    setIsEditDialogOpen(true);
  };
  
  const handleToggleApproval = (child: Child) => {
    toggleApprovalMutation.mutate({
      childId: child.id,
      hasApproval: !child.hasGuardianApproval,
    });
  };
  
  const onSubmitEdit = form.handleSubmit((values) => {
    if (!selectedChild) return;
    
    updateChildMutation.mutate({
      childId: selectedChild.id,
      values,
      relationshipId: selectedChild.relationshipId,
    });
  });

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
          <div className="text-xs text-gray-500">Relationship: {child.relationship || "Parent"}</div>
        </div>
      ),
    },
    {
      key: "health" as const,
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
      key: "emergency" as const,
      header: "Emergency Contact",
      render: (value: any, child: Child) => (
        <div className="space-y-1">
          {child.emergencyContactName && (
            <div className="text-sm">
              <span className="font-medium">Name:</span> {child.emergencyContactName}
            </div>
          )}
          {child.emergencyContactPhone && (
            <div className="text-sm">
              <span className="font-medium">Phone:</span> {child.emergencyContactPhone}
            </div>
          )}
          {!child.emergencyContactName && !child.emergencyContactPhone && (
            <div className="text-sm text-gray-500">No emergency contact</div>
          )}
        </div>
      ),
    },
    {
      key: "approval" as const,
      header: "Guardian Approval",
      render: (value: any, child: Child) => (
        <div>
          {child.hasGuardianApproval ? (
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">Approved</span>
            </div>
          ) : (
            <div className="flex items-center">
              <HeartOff className="h-4 w-4 text-amber-600 mr-1" />
              <span className="text-amber-600">Not Approved</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1"
            onClick={() => handleToggleApproval(child)}
          >
            {child.hasGuardianApproval ? "Revoke" : "Approve"}
          </Button>
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
            onClick={() => handleEditChild(child)}
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
              pagination
            />
          )}
        </CardContent>
      </Card>

      <AddChildForm 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["children"] })}
      />
      
      {/* Edit Child Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Child Information</DialogTitle>
            <DialogDescription>
              Update your child's information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={onSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="grandparent">Grandparent</SelectItem>
                          <SelectItem value="other_relative">Other Relative</SelectItem>
                          <SelectItem value="caregiver">Caregiver</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="medicalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Information</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateChildMutation.isPending}>
                  {updateChildMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
