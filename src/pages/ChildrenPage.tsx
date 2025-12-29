import React, { useState } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, UserPlus, Edit, Trash2, Loader2, AlertTriangle, Phone, Search } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AddChildModal from '@/components/parent/AddChildModal';
import EditChildModal from '@/components/parent/EditChildModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ChildData {
  id: string;
  first_name: string;
  last_name: string;
  age?: number | null;
  allergies?: string | null;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

const ChildrenPage = () => {
  const { children, isLoading, deleteChild, isDeletingChild, refetch } = useChildren();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);

  const filteredChildren = children?.filter((child: ChildData) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      child.first_name?.toLowerCase().includes(searchLower) ||
      child.last_name?.toLowerCase().includes(searchLower) ||
      child.allergies?.toLowerCase().includes(searchLower)
    );
  });

  const openEditDialog = (child: ChildData) => {
    setSelectedChild(child);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (child: ChildData) => {
    setSelectedChild(child);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteChild = () => {
    if (!selectedChild) return;
    deleteChild(selectedChild.id);
    setIsDeleteDialogOpen(false);
    setSelectedChild(null);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedChild(null);
    refetch();
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Children</h1>
            <p className="text-muted-foreground">Manage children information</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search children..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Card className="px-4 py-2">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{children?.length || 0}</div>
            </Card>
            <Card className="px-4 py-2">
              <div className="text-sm text-muted-foreground">With Allergies</div>
              <div className="text-2xl font-bold">
                {children?.filter((c: ChildData) => c.allergies).length || 0}
              </div>
            </Card>
          </div>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredChildren && filteredChildren.length > 0 ? (
            filteredChildren.map((child: ChildData) => (
              <Card key={child.id} className="relative group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        {child.age && (
                          <Badge variant="outline" className="mt-1">
                            Age {child.age}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(child)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(child)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {child.allergies && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Allergies:</span>{' '}
                        <span className="text-muted-foreground">{child.allergies}</span>
                      </div>
                    </div>
                  )}
                  {child.medical_info && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Medical:</span> {child.medical_info}
                    </div>
                  )}
                  {child.emergency_contact_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {child.emergency_contact_name}
                      {child.emergency_contact_phone && ` • ${child.emergency_contact_phone}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-center">
                <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Children Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No children match your search' : 'Add children to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Child Modal */}
      <EditChildModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        child={selectedChild}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedChild?.first_name} {selectedChild?.last_name}? This will also remove all associated attendance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChild} 
              disabled={isDeletingChild}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingChild ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnifiedDashboardLayout>
  );
};

export default ChildrenPage;
