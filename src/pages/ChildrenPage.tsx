import React, { useState } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, UserPlus, Edit, Trash2, Loader2, AlertTriangle, Phone, Search, Heart, Sparkles, ChevronRight } from 'lucide-react';
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

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Children</h1>
            <p className="text-sm text-muted-foreground">Manage child records and medical information.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search children..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full md:w-[250px] pl-9"
                />
             </div>
             {canManage && (
                <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="h-10"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Child
                </Button>
             )}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
             <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Children</p>
                       <h3 className="text-3xl font-bold tracking-tight">
                         {children?.length || 0}
                       </h3>
                    </div>
                   <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Baby className="h-5 w-5 text-primary" />
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="shadow-sm">
             <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Medical Alerts</p>
                      <h3 className="text-3xl font-bold text-destructive tracking-tight">
                        {children?.filter((c: ChildData) => c.allergies).length || 0}
                      </h3>
                   </div>
                   <div className="h-10 w-10 rounded bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary text-primary-foreground">
             <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Expected Today</p>
                      <h3 className="text-3xl font-bold tracking-tight">
                        {children?.length || 0}
                      </h3>
                   </div>
                   <div className="h-10 w-10 rounded bg-card/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                   </div>
                </div>
             </CardContent>
          </Card>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm">Loading database...</p>
          </div>
          ) : filteredChildren && filteredChildren.length > 0 ? (
          filteredChildren.map((child: ChildData) => (
              <Card key={child.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full bg-card">
                  <div className="relative h-40 bg-muted">
                      {child.photo_url ? (
                          <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center">
                              <Baby className="h-12 w-12 text-muted-foreground/20" />
                          </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                          <h4 className="text-lg font-bold text-white leading-tight">{child.first_name} {child.last_name}</h4>
                          {child.age && (
                              <p className="text-xs text-white/80 font-medium">{child.age} years old</p>
                          )}
                      </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="space-y-3 flex-1">
                           {child.allergies ? (
                          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded border border-destructive/20">
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                   <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">Medical Alert</p>
                                   <p className="text-xs font-medium leading-relaxed">{child.allergies}</p>
                              </div>
                          </div>
                          ) : (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                              <Heart className="h-4 w-4 text-muted-foreground" />
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">No alerts</p>
                          </div>
                          )}

                          {child.emergency_contact_name && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                   <p className="text-[9px] font-bold text-muted-foreground uppercase">{child.emergency_contact_name}</p>
                                   <p className="text-xs font-medium truncate">{child.emergency_contact_phone || 'Unlisted'}</p>
                              </div>
                          </div>
                          )}
                      </div>

                      <div className="pt-4 border-t flex items-center justify-between">
                          <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => navigate(`/children/${child.id}/medical`)}
                              className="px-0 h-auto font-bold text-xs"
                          >
                              View Profile <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                          
                          <div className="flex gap-1">
                              {canManage && (
                              <>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => openEditDialog(child)}
                                      className="h-8 w-8"
                                  >
                                      <Edit className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => openDeleteDialog(child)}
                                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </>
                              )}
                          </div>
                      </div>
                  </CardContent>
              </Card>
          ))
          ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-lg bg-muted/30">
              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center mx-auto mb-6">
                  <Baby className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold mb-1">No children found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm ? "No results for your search criteria." : "Start by adding child profiles to your organization."}
              </p>
              {!searchTerm && canManage && (
                  <Button 
                      onClick={() => setIsAddDialogOpen(true)}
                  >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register New Child
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Records</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="text-foreground font-bold">{selectedChild?.first_name} {selectedChild?.last_name}</span>? 
              This action permanent and will delete all associated attendance history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeletingChild}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingChild ? 'Processing...' : 'Delete Content'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <UnifiedDashboardLayout>
      {content}
    </UnifiedDashboardLayout>
  );
};

export default ChildrenPage;

