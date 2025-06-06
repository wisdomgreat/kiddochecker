
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useAuth } from '@/context/AuthContext';
import ChildCard from '@/components/children/ChildCard';
import AddEditChildDialog from '@/components/children/AddEditChildDialog';
import { Child } from '@/hooks/useChildren';

const ChildrenPage = () => {
  const { userRole } = useAuth();
  const { children, addChild, updateChild, deleteChild, isLoading, isAddingChild, isUpdatingChild } = useChildren();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const filteredChildren = children.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddChild = (childData: any) => {
    addChild(childData);
    setShowAddDialog(false);
  };

  const handleEditChild = (childData: any) => {
    updateChild(childData);
    setEditingChild(null);
  };

  const handleDeleteChild = (childId: string) => {
    if (confirm('Are you sure you want to delete this child record?')) {
      deleteChild(childId);
    }
  };

  const canManageAllChildren = ['admin', 'super_admin', 'staff'].includes(userRole || '');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {canManageAllChildren ? 'All Children' : 'My Children'}
            </h1>
            <p className="text-muted-foreground">
              {canManageAllChildren 
                ? 'Manage all registered children in your organization.'
                : 'Manage your children\'s information and details.'
              }
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">
                {canManageAllChildren ? 'Registered' : 'Your children'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="h-4 w-4 bg-red-500 rounded-full" />
              <CardTitle className="text-sm font-medium ml-2">With Allergies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {children.filter(child => child.allergies).length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="h-4 w-4 bg-orange-500 rounded-full" />
              <CardTitle className="text-sm font-medium ml-2">Medical Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {children.filter(child => child.medical_info).length}
              </div>
              <p className="text-xs text-muted-foreground">With medical notes</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search children..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredChildren.length > 0 ? (
            filteredChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={setEditingChild}
                onDelete={handleDeleteChild}
                showActions={true}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No children found matching your search.' : 'No children registered yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              )}
            </div>
          )}
        </div>

        <AddEditChildDialog
          isOpen={showAddDialog || !!editingChild}
          onClose={() => {
            setShowAddDialog(false);
            setEditingChild(null);
          }}
          onSave={editingChild ? handleEditChild : handleAddChild}
          child={editingChild}
          isLoading={isAddingChild || isUpdatingChild}
        />
      </div>
    </DashboardLayout>
  );
};

export default ChildrenPage;
