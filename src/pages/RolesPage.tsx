import { useState, useMemo } from "react";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Shield, ShieldAlert, ShieldCheck, Check, Settings, Trash2, 
  Loader2, Info, LayoutGrid, ListChecks, ArrowRight, ShieldQuestion,
  Lock, Edit3, Save, X, Search, Filter, Fingerprint, Activity,
  ChevronRight, ExternalLink
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const RolesPage = () => {
  const { isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("roles");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit/Create form state
  const [entityForm, setEntityForm] = useState({ 
    id: "",
    name: "", 
    description: "", 
    base_role: "staff",
    type: "role" as "role" | "group",
    is_system_role: false
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch all roles (system + custom)
  const { data: allRoles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["all-custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select(`
          *,
          role_permissions (
            permission_id
          )
        `)
        .order("is_system_role", { ascending: false })
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const systemRoles = useMemo(() => allRoles.filter((r: any) => r.is_system_role), [allRoles]);
  const customRoles = useMemo(() => allRoles.filter((r: any) => !r.is_system_role), [allRoles]);

  // Fetch security groups
  const { data: securityGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["security-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_groups")
        .select(`
          *,
          group_permissions (
            permission_id
          )
        `)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Upsert entity mutation (Create or Update)
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const isGroup = entityForm.type === 'group';
      const table = isGroup ? 'security_groups' : 'custom_roles';
      
      const payload: any = { 
        name: entityForm.name, 
        description: entityForm.description 
      };
      
      if (!isGroup) {
        payload.base_role = entityForm.base_role;
      }

      let entityId = entityForm.id;

      if (entityId) {
        // Update existing
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', entityId);
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from(table)
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        entityId = data.id;
      }

      // Sync permissions
      const permTable = isGroup ? 'group_permissions' : 'role_permissions';
      const idKey = isGroup ? 'group_id' : 'role_id';
      
      // Delete old permissions
      await supabase.from(permTable).delete().eq(idKey, entityId);
      
      // Add new permissions
      if (selectedPermissions.length > 0) {
        const perms = selectedPermissions.map(pid => ({
          [idKey]: entityId,
          permission_id: pid
        }));
        const { error: permError } = await supabase.from(permTable).insert(perms);
        if (permError) throw permError;
      }
      
      return entityId;
    },
    onSuccess: () => {
      toast({ 
        title: entityForm.id ? "Updates Committed" : "Entity Defined", 
        description: `Security profile has been successfully ${entityForm.id ? 'updated' : 'created'}.` 
      });
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["all-custom-roles"] });
      queryClient.invalidateQueries({ queryKey: ["security-groups"] });
    },
    onError: (err: any) => {
      toast({ title: "Operation Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleDelete = async (id: string, type: 'role' | 'group') => {
    const table = type === 'role' ? 'custom_roles' : 'security_groups';
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
       toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entity Removed", description: "Profile has been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: [type === 'role' ? "all-custom-roles" : "security-groups"] });
    }
  };

  const handleEditClick = (entity: any, type: 'role' | 'group') => {
    setSelectedEntity({...entity, type});
    setEntityForm({
      id: entity.id,
      name: entity.name,
      description: entity.description || "",
      base_role: entity.base_role || "staff",
      type: type,
      is_system_role: entity.is_system_role || false
    });
    setSelectedPermissions(
      type === 'role' 
        ? (entity.role_permissions?.map((p: any) => p.permission_id) || [])
        : (entity.group_permissions?.map((p: any) => p.permission_id) || [])
    );
    setIsEditDialogOpen(true);
  };

  const togglePermission = (pid: string) => {
    setSelectedPermissions(prev => 
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return customRoles;
    return customRoles.filter((r: any) => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customRoles, searchQuery]);

  if (!isSuperAdmin) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="h-24 w-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="h-12 w-12 text-rose-500" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tighter">Access Terminated</h1>
          <p className="text-slate-500 max-w-md font-medium text-lg">Your current clearance level is insufficient to access Security Governance protocols.</p>
          <Button onClick={() => window.history.back()} variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-bold border-2">Return to Safety</Button>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-10 max-w-7xl mx-auto py-6">
        {/* Modern Premium Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-card/80 p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden">
              <div className="flex items-center gap-8 relative z-10">
                  <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3 transition-transform group-hover:rotate-0">
                      <Shield className="h-10 w-10 text-white" />
                  </div>
                  <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">Security Governance</h1>
                        <Badge variant="outline" className="bg-indigo-50/50 text-indigo-600 border-indigo-100 h-6 px-3 rounded-full text-[10px] font-black uppercase">v2.4 Audit</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
                        <Fingerprint className="h-3 w-3" />
                        INSTITUTIONAL AUTHORIZATION CONTROL
                      </div>
                  </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <Button 
                    onClick={() => {
                        setSelectedPermissions([]);
                        setEntityForm({ id: "", name: "", description: "", base_role: "staff", type: "role", is_system_role: false });
                        setIsCreateDialogOpen(true);
                    }}
                    className="rounded-[1.5rem] shadow-2xl shadow-indigo-200/50 bg-indigo-600 hover:bg-indigo-700 h-16 px-10 font-black uppercase tracking-widest gap-3 text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="h-5 w-5" />
                    Define New Identity
                </Button>
              </div>
          </div>
        </div>

        {/* Dynamic Navigation & Search */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:w-auto">
            <TabsList className="bg-slate-100/80 dark:bg-card/30 p-1.5 rounded-[1.8rem] h-16 border border-slate-200 dark:border-white/5 backdrop-blur-md">
              <TabsTrigger value="system" className="rounded-[1.2rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-xl h-full flex gap-3 transition-all">
                <Lock className="h-4 w-4" /> System Roles
              </TabsTrigger>
              <TabsTrigger value="roles" className="rounded-[1.2rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-xl h-full flex gap-3 transition-all">
                <LayoutGrid className="h-4 w-4" /> Custom Roles
              </TabsTrigger>
              <TabsTrigger value="groups" className="rounded-[1.2rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-xl h-full flex gap-3 transition-all">
                <ShieldCheck className="h-4 w-4" /> Security Groups
              </TabsTrigger>
              <TabsTrigger value="matrix" className="rounded-[1.2rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-xl h-full flex gap-3 transition-all">
                <ListChecks className="h-4 w-4" /> Access Matrix
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search profiles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-16 rounded-[1.5rem] bg-white dark:bg-card/40 border-slate-100 dark:border-white/10 shadow-sm focus:ring-2 ring-indigo-500/20 font-bold"
              />
            </div>
            <Button variant="outline" className="h-16 w-16 rounded-[1.5rem] border-slate-200 bg-white shadow-sm">
              <Filter className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* System Roles Tab */}
          {activeTab === "system" && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {systemRoles.map((role: any) => (
                <SecurityCard 
                  key={role.id} 
                  entity={role} 
                  type="role" 
                  onEdit={() => handleEditClick(role, 'role')}
                  permissions={permissions}
                />
              ))}
            </motion.div>
          )}

          {/* Custom Roles Tab */}
          {activeTab === "roles" && (
            <motion.div 
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredRoles.length === 0 ? (
                <EmptyState icon={LayoutGrid} title="No Custom Roles" description="You haven't defined any organizational override roles yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRoles.map((role: any) => (
                    <SecurityCard 
                      key={role.id} 
                      entity={role} 
                      type="role" 
                      onEdit={() => handleEditClick(role, 'role')}
                      onDelete={() => handleDelete(role.id, 'role')}
                      permissions={permissions}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Security Groups Tab */}
          {activeTab === "groups" && (
            <motion.div 
              key="groups"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {securityGroups.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No Security Groups" description="Define additive permission sets for specialized cross-role squads." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {securityGroups.map((group: any) => (
                    <SecurityCard 
                      key={group.id} 
                      entity={group} 
                      type="group" 
                      onEdit={() => handleEditClick(group, 'group')}
                      onDelete={() => handleDelete(group.id, 'group')}
                      permissions={permissions}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Access Matrix Tab */}
          {activeTab === "matrix" && (
            <motion.div 
              key="matrix"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <AccessMatrix permissions={permissions} roles={allRoles} groups={securityGroups} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Refined Edit/Create Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(v) => { if(!v) { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); } }}>
          <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-[0_0_100px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col h-[90vh]">
              {/* Dialog Header */}
              <div className="bg-slate-950 p-10 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <Badge className="bg-indigo-600 mb-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none">Clearance Level 4</Badge>
                    <DialogTitle className="text-4xl font-black uppercase tracking-tighter mb-2">
                      {entityForm.id ? `Adjusting: ${entityForm.name}` : `Defining New Security Identity`}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                      Institutional Configuration & Authorization Mapping
                    </DialogDescription>
                  </div>
                  <div className="h-20 w-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                    {entityForm.type === 'role' ? <LayoutGrid className="h-10 w-10 text-indigo-400" /> : <ShieldCheck className="h-10 w-10 text-emerald-400" />}
                  </div>
                </div>
              </div>

              {/* Dialog Body */}
              <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Metadata */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-2">Identity Metadata</h3>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Entity Classification</Label>
                        <Select 
                          disabled={!!entityForm.id}
                          value={entityForm.type} 
                          onValueChange={v => setEntityForm({...entityForm, type: v as any})}
                        >
                          <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-slate-100 text-sm font-bold shadow-sm ring-offset-0 focus:ring-2 ring-indigo-500/10 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="role" className="font-bold py-3">Custom Role (Structural)</SelectItem>
                            <SelectItem value="group" className="font-bold py-3">Security Group (Additive)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profile Identifier</Label>
                        <Input 
                          placeholder="e.g., Regional Compliance Officer" 
                          value={entityForm.name}
                          onChange={e => setEntityForm({...entityForm, name: e.target.value})}
                          className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-bold shadow-sm focus:bg-white transition-all" 
                        />
                      </div>

                      {entityForm.type === 'role' && (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inheritance Root (Base)</Label>
                          <Select 
                            value={entityForm.base_role} 
                            onValueChange={v => setEntityForm({...entityForm, base_role: v})}
                          >
                            <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-bold shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              <SelectItem value="staff" className="font-bold py-3">Operational (Staff)</SelectItem>
                              <SelectItem value="teacher" className="font-bold py-3">Pedagogical (Teacher)</SelectItem>
                              <SelectItem value="volunteer" className="font-bold py-3">Limited (Volunteer)</SelectItem>
                              <SelectItem value="admin" className="font-bold py-3">Administrative (Admin)</SelectItem>
                              <SelectItem value="parent" className="font-bold py-3">Family (Parent)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Summary</Label>
                        <Input 
                          placeholder="Summarize clearance scope..." 
                          value={entityForm.description}
                          onChange={e => setEntityForm({...entityForm, description: e.target.value})}
                          className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-bold shadow-sm focus:bg-white transition-all" 
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex gap-4">
                      <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldQuestion className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Policy Guidance</p>
                        <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                          Role permissions are <span className="underline decoration-amber-400 decoration-2">Structural Overrides</span>. Security groups are <span className="underline decoration-amber-400 decoration-2">Additive Elevation</span> granted on top of roles.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Permissions List */}
                  <div className="lg:col-span-7 flex flex-col min-h-0">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col h-full overflow-hidden">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Access Scope Mapping</h3>
                          <Badge className="bg-slate-900 text-white rounded-full px-3 h-5 font-black text-[9px]">{selectedPermissions.length} ACTIVE</Badge>
                        </div>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                           <Input placeholder="Filter perms..." className="h-9 w-40 pl-9 rounded-xl text-[11px] font-bold border-slate-100 bg-slate-50 focus:bg-white" />
                        </div>
                      </div>
                      
                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8">
                          {Object.entries(
                            permissions.reduce((acc: any, p: any) => {
                              const cat = p.category || 'General';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(p);
                              return acc;
                            }, {})
                          ).map(([category, catPerms]: [string, any]) => (
                            <div key={category} className="space-y-4">
                              <div className="flex items-center gap-4 px-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{category} Protocol</span>
                                <div className="h-[1px] flex-1 bg-slate-100" />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {catPerms.map((perm: any) => (
                                  <div 
                                    key={perm.id} 
                                    className={cn(
                                      "group flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer border-2",
                                      selectedPermissions.includes(perm.id) 
                                        ? 'bg-indigo-50/30 border-indigo-600 shadow-lg shadow-indigo-100/30' 
                                        : 'bg-white border-slate-50 hover:border-indigo-100'
                                    )}
                                    onClick={() => togglePermission(perm.id)}
                                  >
                                    <div className="flex gap-4 items-center">
                                      <div className={cn(
                                         "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                         selectedPermissions.includes(perm.id) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                                      )}>
                                        <ShieldCheck className="h-6 w-6" />
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight">
                                          {perm.name.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{perm.description}</p>
                                      </div>
                                    </div>
                                    <div className={cn(
                                      "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all",
                                      selectedPermissions.includes(perm.id) ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'border-slate-100 bg-white'
                                    )}>
                                      {selectedPermissions.includes(perm.id) && <Check className="h-4 w-4 text-white stroke-[4px]" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="bg-white p-10 border-t border-slate-100 flex items-center justify-between gap-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <Button 
                  variant="ghost" 
                  onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }} 
                  className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-16 px-10 gap-2 border-2 border-transparent hover:border-slate-100"
                >
                  <X className="h-4 w-4" /> Discard Changes
                </Button>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={() => upsertMutation.mutate()} 
                    disabled={!entityForm.name || upsertMutation.isPending}
                    className="bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] h-16 px-12 shadow-2xl shadow-slate-400/30 gap-3"
                  >
                    {upsertMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (
                      <>
                        <Save className="h-5 w-5" />
                        {entityForm.id ? "Commit System Updates" : "Authorize New Profile"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
};

/* --- SUB-COMPONENTS --- */

const SecurityCard = ({ entity, type, onEdit, onDelete, permissions }: any) => {
  const isSystem = entity.is_system_role;
  const permsCount = type === 'role' ? (entity.role_permissions?.length || 0) : (entity.group_permissions?.length || 0);
  const colorClass = type === 'role' ? (isSystem ? 'bg-slate-950' : 'bg-indigo-600') : 'bg-emerald-600';
  const label = type === 'role' ? (isSystem ? 'System Profile' : 'Custom Override') : 'Security Group';

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative h-full"
    >
      <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-indigo-100 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
      <Card className="relative h-full border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-card/40 backdrop-blur-xl border border-white/20 flex flex-col">
        <div className={cn("h-2 w-full", colorClass)} />
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start mb-4">
            <Badge className={cn(
              "border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
              type === 'role' ? (isSystem ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-indigo-700') : 'bg-emerald-50 text-emerald-700'
            )}>
              {label}
            </Badge>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all"
                onClick={onEdit}
              >
                <Edit3 className="h-4 w-4 text-slate-600" />
              </Button>
              {!isSystem && onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition-all"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tighter line-clamp-1">{entity.name}</CardTitle>
          <CardDescription className="text-slate-400 font-bold text-[11px] leading-relaxed line-clamp-2 mt-2 h-9">
            {entity.description || (type === 'role' ? "Baseline organizational clearances." : "Additive security elevation group.")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 pt-0 mt-auto">
          <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active clearance</span>
                <span className="text-xl font-black text-foreground">{permsCount} <span className="text-xs text-slate-300">Protocols</span></span>
              </div>
              {isSystem ? (
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
              ) : (
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-inner">
                  <Activity className="h-4 w-4 text-indigo-400" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 h-7 overflow-hidden">
               {(type === 'role' ? entity.role_permissions : entity.group_permissions)?.slice(0, 3).map((p: any) => {
                  const perm = permissions.find((per: any) => per.id === p.permission_id);
                  return (
                    <Badge key={p.permission_id} className="bg-slate-50 text-slate-500 text-[8px] px-2 py-0.5 border-none font-bold uppercase truncate max-w-[80px]">
                      {perm?.name?.replace(/_/g, ' ')}
                    </Badge>
                  );
               })}
            </div>

            <Button 
              onClick={onEdit}
              className={cn(
                "w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-14 shadow-lg transition-all active:scale-[0.98]",
                colorClass,
                "hover:brightness-110 text-white border-none"
              )}
            >
              {isSystem ? 'Audit Clearances' : 'Refine Identity'}
              <ChevronRight className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AccessMatrix = ({ permissions, roles, groups }: any) => {
  const categories = useMemo(() => {
    return permissions.reduce((acc: any, p: any) => {
      const cat = p.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [permissions]);

  return (
    <Card className="border-none shadow-3xl rounded-[3rem] bg-white dark:bg-card/40 backdrop-blur-xl border border-white/20 overflow-hidden">
      <CardHeader className="bg-slate-950 p-10 text-white border-b border-white/5 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
                <Badge className="bg-emerald-600 mb-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border-none">Global Audit Matrix</Badge>
                <CardTitle className="text-3xl font-black tracking-tight uppercase">Security Access Lattice</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Comprehensive cross-profile authorization mapping</CardDescription>
            </div>
            <div className="flex items-center gap-8 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-lg bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">System</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-lg bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Custom</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-lg bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Group</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full h-[700px]">
          <div className="min-w-[1400px]">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-30 backdrop-blur-xl border-b border-slate-100">
                <TableRow className="h-28 border-none hover:bg-transparent">
                  <TableHead className="w-[350px] px-10 bg-slate-50/90 sticky left-0 z-40 font-black uppercase tracking-[0.2em] text-[10px] text-indigo-600 border-r border-slate-200/50">
                    Authorization Protocol
                  </TableHead>
                  {roles.map(role => (
                    <TableHead key={role.id} className="text-center px-6 min-w-[140px]">
                      <div className="flex flex-col items-center gap-2 group cursor-pointer transition-transform hover:scale-105">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase px-2.5 h-5 mb-1 border-none",
                          role.is_system_role ? 'bg-slate-900 text-slate-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        )}>
                          {role.is_system_role ? 'System' : 'Custom'}
                        </Badge>
                        <span className="font-black text-xs text-foreground block max-w-[110px] truncate uppercase tracking-tighter">{role.name}</span>
                      </div>
                    </TableHead>
                  ))}
                  {groups.map(group => (
                    <TableHead key={group.id} className="text-center px-6 min-w-[140px]">
                      <div className="flex flex-col items-center gap-2 group cursor-pointer transition-transform hover:scale-105">
                        <Badge className="bg-emerald-600 text-white text-[8px] font-black uppercase px-2.5 h-5 mb-1 border-none shadow-lg shadow-emerald-100">Group</Badge>
                        <span className="font-black text-xs text-foreground block max-w-[110px] truncate uppercase tracking-tighter">{group.name}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(categories).map(([category, catPerms]: [string, any]) => (
                  <AnimatePresence key={category}>
                    <TableRow className="bg-slate-50/40 h-14 border-none hover:bg-slate-50/60">
                      <TableCell colSpan={roles.length + groups.length + 1} className="px-10 py-4">
                        <div className="flex items-center gap-4">
                           <Badge variant="outline" className="rounded-full bg-white text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] px-4 py-1.5 border-slate-200 border-2">{category} Environment</Badge>
                           <div className="h-[1px] flex-1 bg-slate-200/50" />
                        </div>
                      </TableCell>
                    </TableRow>
                    {catPerms.map((perm: any) => (
                      <TableRow key={perm.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 dark:border-white/5 h-24 group/row">
                        <TableCell className="px-10 sticky left-0 bg-white dark:bg-card/90 z-20 border-r border-slate-100 transition-colors group-hover/row:bg-slate-50">
                          <div className="max-w-[300px]">
                            <p className="font-black text-[13px] text-slate-800 tracking-tight uppercase group-hover/row:text-indigo-600 transition-colors">{perm.name.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-slate-400 font-bold line-clamp-2 mt-1 leading-relaxed">{perm.description}</p>
                          </div>
                        </TableCell>
                        {roles.map(role => {
                          const hasPerm = role.role_permissions?.some((rp: any) => rp.permission_id === perm.id);
                          return (
                            <TableCell key={role.id} className="text-center group/cell">
                              <div className="flex justify-center transition-transform group-hover/cell:scale-125">
                                {hasPerm ? (
                                  <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl animate-in zoom-in-50 duration-500",
                                    role.is_system_role ? 'bg-slate-900' : 'bg-indigo-600'
                                  )}>
                                    <Check className="h-5 w-5 stroke-[4px]" />
                                  </div>
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-100 group-hover/cell:bg-slate-200 transition-colors" />
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                        {groups.map(group => {
                          const hasPerm = group.group_permissions?.some((gp: any) => gp.permission_id === perm.id);
                          return (
                            <TableCell key={group.id} className="text-center group/cell">
                              <div className="flex justify-center transition-transform group-hover/cell:scale-125">
                                {hasPerm ? (
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-100 animate-in zoom-in-50 duration-500">
                                    <Check className="h-5 w-5 stroke-[4px]" />
                                  </div>
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-100 group-hover/cell:bg-slate-200 transition-colors" />
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </AnimatePresence>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
      <div className="bg-slate-50 p-6 flex items-center justify-center gap-8 border-t border-slate-100">
          <div className="flex items-center gap-3">
             <div className="h-4 w-4 rounded-md bg-slate-900" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Clearance</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-4 w-4 rounded-md bg-indigo-600" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Override Active</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-4 w-4 rounded-md bg-emerald-600" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Additive Elevation</span>
          </div>
      </div>
    </Card>
  );
};

const EmptyState = ({ icon: Icon, title, description }: any) => (
  <div className="flex flex-col items-center justify-center py-32 px-10 bg-white/50 border-4 border-dashed border-slate-100 rounded-[3rem] text-center">
    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
      <Icon className="h-10 w-10 text-slate-300" />
    </div>
    <h3 className="text-2xl font-black text-slate-600 mb-2 uppercase tracking-tighter">{title}</h3>
    <p className="text-slate-400 font-bold text-sm max-w-sm leading-relaxed">{description}</p>
  </div>
);

export default RolesPage;
