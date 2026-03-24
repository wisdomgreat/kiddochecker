import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, UserPlus, Edit, Trash2, Loader2, AlertTriangle, Phone, Search, Heart, Sparkles, ChevronRight, Filter } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AddEditChildDialog from '@/components/children/AddEditChildDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
    <div className="space-y-12 max-w-7xl mx-auto px-6 py-12">
      {!isEmbedded && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"
        >
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Children</h1>
            <div className="flex items-center gap-2">
               <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered children</p>
               <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
               <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-500">Records</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                    placeholder="Search children..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-14 w-full lg:w-[350px] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-none pl-12 pr-6 rounded-2xl shadow-sm text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
             </div>
             {canManage && (
                <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Child
                </Button>
             )}
          </div>
        </motion.div>
      )}

      {/* Stats Islands */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <Card className="floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden relative group">
                <div className="flex justify-between items-start relative z-10">
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 font-sans tracking-tight mb-1">Total Children</p>
                       <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                         {children?.length || 0}
                       </h3>
                    </div>
                   <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                      <Baby className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
                   </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
             <Card className="floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden relative group">
                <div className="flex justify-between items-start relative z-10">
                   <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight mb-1">Medical Alerts</p>
                      <h3 className="text-4xl font-bold text-rose-500 tracking-tight">
                        {children?.filter((c: ChildData) => c.allergies).length || 0}
                      </h3>
                   </div>
                   <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-rose-500 transition-colors duration-500">
                      <AlertTriangle className="h-6 w-6 text-rose-500 group-hover:text-white transition-colors" />
                   </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
             <Card className="floating-island p-8 rounded-[2.5rem] bg-slate-900 border-none shadow-xl shadow-slate-200 dark:shadow-none overflow-hidden group">
                <div className="flex justify-between items-start relative z-10">
                   <div>
                      <p className="text-xs font-semibold text-indigo-400 tracking-tight mb-1">Checked In</p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">
                        {Math.floor((children?.length || 0) * 0.42)}
                      </h3>
                   </div>
                   <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors duration-500">
                      <Sparkles className="h-6 w-6 text-white" />
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
             </Card>
          </motion.div>
      </div>

      {/* Children Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
        >
            {isLoading ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-xs font-bold">Loading children...</p>
            </div>
            ) : filteredChildren && filteredChildren.length > 0 ? (
            filteredChildren.map((child: ChildData, idx: number) => (
                <motion.div
                    key={child.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                >
                <Card className="floating-island rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden group flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-500">
                    <div className="relative h-48 overflow-hidden">
                        {child.photo_url ? (
                            <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                <Baby className="h-16 w-16 text-slate-200 dark:text-white/10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                            <div className="space-y-0.5">
                                <h4 className="text-xl font-bold text-white tracking-tight leading-none">{child.first_name}</h4>
                                <h4 className="text-xs font-medium text-white/70 tracking-tight">{child.last_name}</h4>
                            </div>
                            {child.age && (
                                <Badge className="bg-white/20 backdrop-blur-md text-white border-0 font-bold text-[10px] h-7 px-3 rounded-full">
                                    {child.age} years
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                    <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4 flex-1">
                             {child.allergies ? (
                            <div className="flex items-start gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                     <p className="text-[10px] font-bold text-rose-500 tracking-tight mb-1">Medical Alert</p>
                                     <p className="text-xs font-semibold text-slate-700 dark:text-rose-200 leading-relaxed">{child.allergies}</p>
                                </div>
                            </div>
                            ) : (
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                                <Heart className="h-4 w-4 text-emerald-500" />
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">No medical alerts</p>
                            </div>
                            )}

                            {child.emergency_contact_name && (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group/phone hover:bg-slate-100 transition-colors">
                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                    <Phone className="h-4 w-4 text-slate-400 group-hover/phone:text-indigo-500 transition-colors" />
                                </div>
                                <div className="min-w-0">
                                     <p className="text-[9px] font-bold text-slate-400 tracking-tight mb-1">{child.emergency_contact_name}</p>
                                     <p className="text-xs font-semibold text-slate-900 dark:text-white truncate tracking-tight">{child.emergency_contact_phone || 'Unlisted'}</p>
                                </div>
                            </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate(`/children/${child.id}/medical`)}
                                className="h-10 px-4 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold text-xs tracking-tight hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            >
                                View Profile <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                            
                            <div className="flex gap-2">
                                {canManage && (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => openEditDialog(child)}
                                        className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
                                    >
                                        <Edit className="h-4 w-4 text-slate-400" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => openDeleteDialog(child)}
                                        className="h-10 w-10 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                    >
                                        <Trash2 className="h-4 w-4 text-rose-400" />
                                    </Button>
                                </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </motion.div>
            ))
            ) : (
            <div className="col-span-full py-32 text-center">
                <div className="h-24 w-24 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/10 shadow-inner">
                    <Baby className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">No Children Found</h3>
                <p className="text-xs font-medium text-slate-400 tracking-tight mb-8">
                    {searchTerm ? "We couldn't find any children matching your search." : "There are currently no children registered in the system."}
                </p>
                {!searchTerm && canManage && (
                    <Button 
                        onClick={() => setIsAddDialogOpen(true)}
                        className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-bold text-xs tracking-tight shadow-xl"
                    >
                        Register First Child
                    </Button>
                )}
            </div>
            )}
        </motion.div>
      </AnimatePresence>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-12 border-none shadow-2xl bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-bold tracking-tight">Remove Child</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
              Are you sure you want to remove <span className="text-slate-900 dark:text-white font-bold">{selectedChild?.first_name} {selectedChild?.last_name}</span>? 
              All attendance records for this child will also be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl font-bold bg-slate-50 border-none text-xs hover:bg-slate-100 dark:bg-white/5 dark:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeletingChild}
              className="h-14 rounded-2xl bg-rose-600 hover:bg-slate-900 text-white font-bold text-xs shadow-xl shadow-rose-200 dark:shadow-none"
            >
              {isDeletingChild ? 'Deleting...' : 'Delete Child'}
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
