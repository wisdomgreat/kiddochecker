
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Baby,
  Plus,
  Search,
  Edit,
  Trash2,
  Heart,
  AlertTriangle,
  Phone,
  Users
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies: string;
  medical_info: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  parent_id: string;
  created_at: string;
}

const ChildrenManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isEditChildOpen, setIsEditChildOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    allergies: "",
    medical_info: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: ""
  });

  // Fetch children based on user role
  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", userRole],
    queryFn: async () => {
      if (userRole === 'parent') {
        // Parents see only their children
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user?.id)
          .order('first_name');
        if (error) throw error;
        return data || [];
      } else {
        // Staff/admin see all children
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .order('first_name');
        if (error) throw error;
        return data || [];
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const childData = {
        ...formData,
        age: parseInt(formData.age),
        parent_id: user?.id
      };

      if (selectedChild) {
        // Update existing child
        const { error } = await supabase
          .from('children')
          .update(childData)
          .eq('id', selectedChild.id);
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Child information updated successfully",
        });
        setIsEditChildOpen(false);
      } else {
        // Create new child
        const { error } = await supabase
          .from('children')
          .insert([childData]);
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Child added successfully",
        });
        setIsAddChildOpen(false);
      }

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        age: "",
        allergies: "",
        medical_info: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        notes: ""
      });
      setSelectedChild(null);
      queryClient.invalidateQueries({ queryKey: ["children"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (child: Child) => {
    setSelectedChild(child);
    setFormData({
      first_name: child.first_name,
      last_name: child.last_name,
      age: child.age?.toString() || "",
      allergies: child.allergies || "",
      medical_info: child.medical_info || "",
      emergency_contact_name: child.emergency_contact_name || "",
      emergency_contact_phone: child.emergency_contact_phone || "",
      notes: child.notes || ""
    });
    setIsEditChildOpen(true);
  };

  const handleDelete = async (childId: string) => {
    if (!confirm("Are you sure you want to delete this child? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Child deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["children"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredChildren = children.filter((child: Child) =>
    child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const childrenColumns = [
    {
      key: "first_name" as const,
      header: "First Name",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "last_name" as const,
      header: "Last Name", 
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "age" as const,
      header: "Age",
      render: (value: number) => value ? `${value} years` : "-",
    },
    {
      key: "allergies" as const,
      header: "Allergies",
      render: (value: string) => value ? (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Has Allergies
        </Badge>
      ) : (
        <span className="text-muted-foreground">None</span>
      ),
    },
    {
      key: "medical_info" as const,
      header: "Medical Info",
      render: (value: string) => value ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          Has Info
        </Badge>
      ) : (
        <span className="text-muted-foreground">None</span>
      ),
    },
    {
      key: "emergency_contact_name" as const,
      header: "Emergency Contact",
      render: (value: string, child: Child) => value ? (
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <span className="text-sm">{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">Not set</span>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, child: Child) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(child)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(child.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Children Management</h1>
            <p className="text-muted-foreground">
              {userRole === 'parent' ? 'Manage your children\'s information' : 'Manage enrolled children and their information'}
            </p>
          </div>
          <Button onClick={() => setIsAddChildOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by child name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Children Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              {userRole === 'parent' ? 'My Children' : 'All Children'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading children...</div>
            ) : filteredChildren.length === 0 ? (
              <div className="py-8 text-center">
                <Baby className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No children found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No children match your search.' : 'Start by adding a child.'}
                </p>
              </div>
            ) : (
              <DataTable
                columns={childrenColumns}
                data={filteredChildren}
                keyExtractor={(item) => item.id}
              />
            )}
          </CardContent>
        </Card>

        {/* Add Child Dialog */}
        <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  min="0"
                  max="18"
                />
              </div>

              <div>
                <Label>Allergies</Label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  placeholder="List any allergies..."
                />
              </div>

              <div>
                <Label>Medical Information</Label>
                <Textarea
                  value={formData.medical_info}
                  onChange={(e) => setFormData({...formData, medical_info: e.target.value})}
                  placeholder="Any medical conditions or medications..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddChildOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Child</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Child Dialog */}
        <Dialog open={isEditChildOpen} onOpenChange={setIsEditChildOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Child Information</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Same form fields as Add Child */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  min="0"
                  max="18"
                />
              </div>

              <div>
                <Label>Allergies</Label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  placeholder="List any allergies..."
                />
              </div>

              <div>
                <Label>Medical Information</Label>
                <Textarea
                  value={formData.medical_info}
                  onChange={(e) => setFormData({...formData, medical_info: e.target.value})}
                  placeholder="Any medical conditions or medications..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditChildOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Child</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
};

export default ChildrenManagement;
