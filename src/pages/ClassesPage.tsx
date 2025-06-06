
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import ClassCard from '@/components/classes/ClassCard';
import AddEditClassDialog from '@/components/classes/AddEditClassDialog';
import { Class } from '@/types/classes';

const ClassesPage = () => {
  const { classes, addClass, updateClass, deleteClass, isLoading, isAddingClass, isUpdatingClass } = useClasses();
  const { attendance } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassAttendanceCount = (classId: string) => {
    return attendance.filter(record => 
      record.class_id === classId && !record.checked_out_at
    ).length;
  };

  const handleAddClass = (classData: any) => {
    addClass(classData);
    setShowAddDialog(false);
  };

  const handleEditClass = (classData: any) => {
    updateClass(classData);
    setEditingClass(null);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(classId);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes Management</h1>
            <p className="text-muted-foreground">
              Create and manage classes for your organization.
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
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
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onEdit={setEditingClass}
                onDelete={handleDeleteClass}
                attendanceCount={getClassAttendanceCount(classItem.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No classes found matching your search.' : 'No classes created yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              )}
            </div>
          )}
        </div>

        <AddEditClassDialog
          isOpen={showAddDialog || !!editingClass}
          onClose={() => {
            setShowAddDialog(false);
            setEditingClass(null);
          }}
          onSave={editingClass ? handleEditClass : handleAddClass}
          classItem={editingClass}
          isLoading={isAddingClass || isUpdatingClass}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClassesPage;
