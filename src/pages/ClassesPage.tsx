import { useState, useMemo } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
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
import { useAuth } from '@/hooks/useAuth';

const ClassesPage = () => {
  const { classes, isLoading, error, refetch, addClass, updateClass, deleteClass, isAddingClass, isUpdatingClass } = useClasses();
  const { isAdmin } = useAuth();
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
    <UnifiedDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
              <p className="text-sm text-muted-foreground">Manage classrooms and capacity</p>
            </div>
            {isAdmin && (
              <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            )}
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Classes</p>
                      <h3 className="text-3xl font-bold tracking-tight">
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalClasses}
                      </h3>
                   </div>
                   <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Capacity</p>
                      <h3 className="text-3xl font-bold tracking-tight">
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCapacity}
                      </h3>
                   </div>
                   <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Active Today</p>
                      <h3 className="text-3xl font-bold tracking-tight">
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalClasses}
                      </h3>
                   </div>
                </div>
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
                className="pl-9 w-full md:w-[300px]"
              />
            </div>
          </div>

          {/* Class Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="text-center py-12 text-destructive">
                <p className="font-bold">Error loading database</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          ) : filteredClasses.length === 0 ? (
            <Card className="border-2 border-dashed bg-muted/30">
              <CardContent className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">No classes found</p>
                <p className="text-sm mb-6">Start by creating your first instructional group.</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <Card key={classItem.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">{classItem.name}</CardTitle>
                      {classItem.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{classItem.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAssigningTeacher({ id: classItem.id, name: classItem.name })}
                        className="h-8 w-8"
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingRoster({ id: classItem.id, name: classItem.name })}
                        className="h-8 w-8"
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingClass(classItem)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingClass(classItem)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      {classItem.age_range && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Age Range</span>
                          <span className="font-bold">{classItem.age_range}</span>
                        </div>
                      )}
                      {classItem.room && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Room</span>
                          <span className="font-bold">{classItem.room}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-bold">{classItem.capacity || 'N/A'}</span>
                      </div>
                    </div>
                    {classItem.capacity && (
                      <Progress value={0} className="h-1" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AddEditClassDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={handleAddClass}
          isLoading={isAddingClass}
        />

        <AddEditClassDialog
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          onSave={handleUpdateClass}
          classItem={editingClass}
          isLoading={isUpdatingClass}
        />

        <AlertDialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingClass?.name}"? 
                This action is permanent and cannot be reversed.
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
  );
};

export default ClassesPage;

