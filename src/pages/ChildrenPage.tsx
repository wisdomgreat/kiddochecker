
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useAuth } from '@/context/AuthContext';

const ChildrenPage = () => {
  const { user, userRole } = useAuth();
  const { children, isLoading, addChild } = useChildren();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChild, setNewChild] = useState({
    first_name: '',
    last_name: '',
    age: '',
    allergies: '',
    medical_info: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const filteredChildren = children.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addChild({
        ...newChild,
        age: newChild.age ? parseInt(newChild.age) : null,
        parent_id: user.id
      });
      setNewChild({
        first_name: '',
        last_name: '',
        age: '',
        allergies: '',
        medical_info: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding child:', error);
    }
  };

  const canAddChildren = userRole === 'parent' || userRole === 'admin' || userRole === 'super_admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Children Management</h1>
            <p className="text-muted-foreground">
              {userRole === 'parent' ? 'Manage your children' : 'View and manage all children'}
            </p>
          </div>
          {canAddChildren && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          )}
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

        {/* Add Child Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Child</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name"
                    value={newChild.first_name}
                    onChange={(e) => setNewChild({...newChild, first_name: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={newChild.last_name}
                    onChange={(e) => setNewChild({...newChild, last_name: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Age"
                    type="number"
                    value={newChild.age}
                    onChange={(e) => setNewChild({...newChild, age: e.target.value})}
                  />
                  <Input
                    placeholder="Emergency Contact Name"
                    value={newChild.emergency_contact_name}
                    onChange={(e) => setNewChild({...newChild, emergency_contact_name: e.target.value})}
                  />
                  <Input
                    placeholder="Emergency Contact Phone"
                    value={newChild.emergency_contact_phone}
                    onChange={(e) => setNewChild({...newChild, emergency_contact_phone: e.target.value})}
                  />
                  <Input
                    placeholder="Allergies"
                    value={newChild.allergies}
                    onChange={(e) => setNewChild({...newChild, allergies: e.target.value})}
                  />
                </div>
                <Input
                  placeholder="Medical Information"
                  value={newChild.medical_info}
                  onChange={(e) => setNewChild({...newChild, medical_info: e.target.value})}
                />
                <div className="flex space-x-2">
                  <Button type="submit">Add Child</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Children List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {child.first_name} {child.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {child.age && <p>Age: {child.age}</p>}
                    {child.allergies && (
                      <p className="text-orange-600">Allergies: {child.allergies}</p>
                    )}
                    {child.emergency_contact_name && (
                      <p>Emergency: {child.emergency_contact_name}</p>
                    )}
                    {child.emergency_contact_phone && (
                      <p>Phone: {child.emergency_contact_phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No children found matching your search.' : 'No children registered yet.'}
              </p>
              {!searchTerm && canAddChildren && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChildrenPage;
