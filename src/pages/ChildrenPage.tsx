import React, { useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, UserPlus, Edit, Trash2, Loader2, AlertTriangle, Phone, Search, Heart, ChevronRight, ShieldAlert } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AddEditChildDialog from '@/components/children/AddEditChildDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ChildData {
  id: string;
  first_name: string;
  last_name: string;
  age?: number | null;
  allergies?: string | null;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string | null;
  created_at?: string;
}

const ChildrenPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const { children, isLoading, deleteChild, isDeletingChild, refetch } = useChildren();
  const { isAdmin, isParent } = useAuth();
  const canManage = isAdmin || isParent;

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

  const mainContent = (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/70 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by child name or medical alert..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 rounded-xl bg-background border-border/60 text-xs"
          />
        </div>
        {canManage && (
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="h-10 rounded-xl text-xs font-semibold uppercase tracking-wider gap-2 px-5 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Add Child Record
          </Button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/70 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{children?.length || 0}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Baby className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Medical Alerts</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {children?.filter((c: ChildData) => c.allergies).length || 0}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm rounded-2xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Directory</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">100% Verified</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider">Loading children directory...</p>
          </div>
        ) : filteredChildren && filteredChildren.length > 0 ? (
          filteredChildren.map((child: ChildData) => (
            <Card key={child.id} className="overflow-hidden border border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col h-full bg-card group">
              {/* Card Photo Header */}
              <div className="relative h-36 bg-muted/40">
                {child.photo_url ? (
                  <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 to-primary/10">
                    <Baby className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <h4 className="text-base font-bold text-white leading-tight">{child.first_name} {child.last_name}</h4>
                  {child.age !== undefined && child.age !== null && (
                    <p className="text-xs text-white/80 font-medium">{child.age} years old</p>
                  )}
                </div>
              </div>
              
              <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {child.allergies ? (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Medical Alert</p>
                        <p className="text-xs font-medium mt-0.5 leading-snug">{child.allergies}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-xl border border-border/40 text-muted-foreground">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No known allergies</span>
                    </div>
                  )}

                  {child.emergency_contact_name && (
                    <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-xl border border-border/40">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{child.emergency_contact_name}</p>
                        <p className="text-xs font-semibold text-foreground truncate">{child.emergency_contact_phone || 'Unlisted'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/children/${child.id}/medical`)}
                    className="px-0 h-auto font-bold text-xs text-primary hover:bg-transparent hover:underline"
                  >
                    View Full Profile <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {canManage && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(child)}
                          className="h-8 w-8 rounded-lg hover:bg-muted"
                        >
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(child)}
                          className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border/70 rounded-2xl bg-card">
            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Baby className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No child records found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchTerm ? "No results match your search query." : "Get started by adding children to your system directory."}
            </p>
            {!searchTerm && canManage && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4 rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register First Child
              </Button>
            )}
          </div>
        )}
      </div>

      <AddEditChildDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      <AddEditChildDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        childId={selectedChild?.id}
        onSuccess={handleEditSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Remove Child Record
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove <strong className="text-foreground">{selectedChild?.first_name} {selectedChild?.last_name}</strong>? This action will permanently remove associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeletingChild}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
            >
              {isDeletingChild ? 'Deleting...' : 'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isEmbedded) return mainContent;

  return (
    <UnifiedDashboardLayout>
      <DashboardShell
        role="admin"
        title="Children Directory"
        subtitle="Manage enrolled child profiles, medical notes, and emergency contacts."
      >
        {mainContent}
      </DashboardShell>
    </UnifiedDashboardLayout>
  );
};

export default ChildrenPage;
