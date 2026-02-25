import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Plus, Users, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import AddEditClassDialog from '@/components/classes/AddEditClassDialog';
import { AssignTeacherDialog } from '@/components/classes/AssignTeacherDialog';
import { ClassRosterDialog } from '@/components/classes/ClassRosterDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Class } from '@/types/classes';

const ClassesPage = () => {
  const { classes, isLoading, error, refetch, addClass, updateClass, deleteClass, isAddingClass, isUpdatingClass } = useClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState<{ id: string; name: string } | null>(null);
  const [viewingRoster, setViewingRoster] = useState<{ id: string; name: string } | null>(null);

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    return classes.filter(cls =>
      cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.room?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0);
    // Note: Enrollment would come from attendance data - using placeholder for now
    return { totalClasses, totalCapacity, enrollment: 0 };
  }, [classes]);

  const handleAddClass = (classData: any) => {
    addClass(classData);
    setIsAddDialogOpen(false);
  };

  const handleUpdateClass = (classData: any) => {
    updateClass(classData);
    setEditingClass(null);
  };

  const handleDeleteClass = () => {
    if (deletingClass) {
      deleteClass(deletingClass.id);
      setDeletingClass(null);
    }
  };

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher']}>
      <UnifiedDashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
              <p className="text-muted-foreground">Manage classes and schedules</p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalClasses}
                </div>
                <p className="text-xs text-muted-foreground">Active classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCapacity}
                </div>
                <p className="text-xs text-muted-foreground">Maximum children</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalClasses}
                </div>
                <p className="text-xs text-muted-foreground">All active</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>

          {/* Class Cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="text-center py-8 text-destructive">
                <p>Error loading classes</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No classes found</p>
                <p className="text-sm mb-4">Get started by creating your first class</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {filteredClasses.map((classItem) => (
                <motion.div
                  key={classItem.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3 } }
                  }}
                >
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{classItem.name}</CardTitle>
                        {classItem.description && (
                          <p className="text-sm text-muted-foreground mt-1">{classItem.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[120px]">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAssigningTeacher({ id: classItem.id, name: classItem.name })}
                          title="Assign Teacher"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingRoster({ id: classItem.id, name: classItem.name })}
                          title="View Roster"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingClass(classItem)}
                          title="Edit Class"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingClass(classItem)}
                          className="text-destructive hover:text-destructive"
                          title="Delete Class"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {classItem.age_range && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Age Range:</span>
                          <span className="text-sm font-medium">{classItem.age_range}</span>
                        </div>
                      )}
                      {classItem.room && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Room:</span>
                          <span className="text-sm font-medium">{classItem.room}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Capacity:</span>
                        <span className="text-sm font-medium">{classItem.capacity || 'Unlimited'}</span>
                      </div>
                      {classItem.capacity && (
                        <Progress value={0} className="h-2" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add Class Dialog */}
        <AddEditClassDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={handleAddClass}
          isLoading={isAddingClass}
        />

        {/* Edit Class Dialog */}
        <AddEditClassDialog
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          onSave={handleUpdateClass}
          classItem={editingClass}
          isLoading={isUpdatingClass}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingClass?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AssignTeacherDialog
          classId={assigningTeacher?.id || ''}
          className={assigningTeacher?.name || ''}
          open={!!assigningTeacher}
          onOpenChange={(open) => !open && setAssigningTeacher(null)}
          onSuccess={() => {
            setAssigningTeacher(null);
          }}
        />

        <ClassRosterDialog
          classId={viewingRoster?.id || ''}
          className={viewingRoster?.name || ''}
          open={!!viewingRoster}
          onOpenChange={(open) => !open && setViewingRoster(null)}
        />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default ClassesPage;
