import { useState } from "react";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, ShieldAlert, ShieldCheck, Check, Settings, Trash2, Loader2, Info } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/lib/i18n";

const RolesPage = () => {
  const { isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Create role form state
  const [newRole, setNewRole] = useState({ name: "", description: "", base_role: "staff" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
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
        .order("category");
      if (error) throw error;
      return data;
    },
  });

  // Fetch role permissions
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions", selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole) return [];
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", selectedRole.id);
      if (error) throw error;
      return data.map((p: any) => p.permission_id);
    },
    enabled: !!selectedRole,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      // 1. Create role
      const { data, error } = await supabase
        .from("custom_roles")
        .insert([{ ...newRole }])
        .select()
        .single();
      if (error) throw error;

      // 2. Assign permissions
      if (selectedPermissions.length > 0) {
        const perms = selectedPermissions.map(pid => ({
          role_id: data.id,
          permission_id: pid
        }));
        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(perms);
        if (permError) throw permError;
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: "Role Created", description: "Successfully defined custom role." });
      setIsCreateDialogOpen(false);
      setNewRole({ name: "", description: "", base_role: "staff" });
      setSelectedPermissions([]);
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string, permissions: string[] }) => {
      // Delete old permissions
      await supabase.from("role_permissions").delete().eq("role_id", roleId);
      
      // Add new permissions
      if (permissions.length > 0) {
        const perms = permissions.map(pid => ({
          role_id: roleId,
          permission_id: pid
        }));
        const { error } = await supabase.from("role_permissions").insert(perms);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Permissions Updated", description: "Successfully updated role access." });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    }
  });

  const handleDeleteRole = async (roleId: string) => {
    const { error } = await supabase.from("custom_roles").delete().eq("id", roleId);
    if (!error) {
      toast({ title: "Role Deleted", description: "Custom role removed from system." });
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (!isSuperAdmin) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 opacity-20" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Restrictred</h1>
          <p className="text-slate-500 max-w-md">Only Super Administrators can manage system-wide custom roles and permissions.</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Access Roles</h1>
            <p className="text-slate-500 font-medium">Define custom roles and granular security permissions.</p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-bold gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Custom Role
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.length === 0 && !isLoadingRoles && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Custom Roles Yet</h3>
              <p className="text-slate-500">Create a role to override default system behavior.</p>
            </div>
          )}

          {roles.map((role: any) => (
            <Card key={role.id} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl group relative overflow-hidden transition-all hover:scale-[1.02]">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2">
                    {role.base_role} Base
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => { setSelectedRole(role); setSelectedPermissions(rolePermissions); setIsEditDialogOpen(true); }}
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{role.name}</CardTitle>
                <CardDescription className="text-slate-500 line-clamp-2">{role.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pt-4 mt-4 border-t border-slate-50">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Core Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full bg-slate-50/50 text-xs px-3 py-1 font-medium border-slate-200 text-slate-600">
                      View
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 text-xs px-3 py-1 font-bold">
                      Full Access
                    </Badge>
                  </div>
                </div>
                <Button 
                  onClick={() => { setSelectedRole(role); setIsEditDialogOpen(true); }}
                  className="w-full mt-6 rounded-2xl bg-slate-900 hover:bg-black font-bold h-11"
                >
                  Edit Permissions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <DialogTitle className="text-2xl font-black mb-1">New Custom Role</DialogTitle>
                <DialogDescription className="text-indigo-100 font-medium opacity-80">Define a new security profile for your staff.</DialogDescription>
              </div>
              <Shield className="absolute -bottom-10 -right-10 h-48 w-48 text-white opacity-10 rotate-12" />
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold ml-1">Role Name</Label>
                  <Input 
                    placeholder="e.g., Morning Shift Lead" 
                    value={newRole.name}
                    onChange={e => setNewRole({...newRole, name: e.target.value})}
                    className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold ml-1">Base Template</Label>
                  <Select 
                    value={newRole.base_role} 
                    onValueChange={v => setNewRole({...newRole, base_role: v})}
                  >
                    <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-slate-200 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff (Standard)</SelectItem>
                      <SelectItem value="teacher">Teacher (Class Access)</SelectItem>
                      <SelectItem value="volunteer">Volunteer (Shadow Access)</SelectItem>
                      <SelectItem value="admin">Admin (Wide Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold ml-1">Description</Label>
                <Input 
                  placeholder="Define the purpose of this role..." 
                  value={newRole.description}
                  onChange={e => setNewRole({...newRole, description: e.target.value})}
                  className="rounded-2xl h-12 bg-slate-50 border-slate-200" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-900 font-black uppercase text-xs tracking-widest">Select Permissions</Label>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 rounded-full px-3">{selectedPermissions.length} Active</Badge>
                </div>
                <ScrollArea className="h-[250px] border border-slate-100 rounded-3xl bg-slate-50/50 p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(
                      permissions.reduce((acc: any, p: any) => {
                        const cat = p.category || 'legacy';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(p);
                        return acc;
                      }, {})
                    ).map(([category, catPerms]: [string, any]) => (
                      <div key={category} className="space-y-2 mb-6 last:mb-0">
                        <Badge variant="outline" className="bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 border-none mb-2 px-3">
                          {(t as any)(`category_${category}`) || category.toUpperCase()}
                        </Badge>
                        {catPerms.map((perm: any) => (
                          <div 
                            key={perm.id} 
                            className={`group flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                              selectedPermissions.includes(perm.id) 
                                ? 'bg-white border-2 border-indigo-600 shadow-md shadow-indigo-100' 
                                : 'bg-white/50 border border-slate-100 hover:border-indigo-200'
                            }`}
                            onClick={() => togglePermission(perm.id)}
                          >
                            <div className="flex gap-3 items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                 selectedPermissions.includes(perm.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                              }`}>
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">
                                  {(t as any)(`permission_${perm.name}`) || perm.name.replace(/_/g, ' ').toUpperCase()}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">{perm.description}</p>
                              </div>
                            </div>
                            <Checkbox 
                              checked={selectedPermissions.includes(perm.id)} 
                              onCheckedChange={() => togglePermission(perm.id)}
                              className="rounded-full h-5 w-5 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter className="bg-slate-50/80 p-6 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={() => createRoleMutation.mutate()} 
                disabled={!newRole.name || createRoleMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px] rounded-2xl font-black h-12 shadow-lg shadow-indigo-200"
              >
                {createRoleMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save New Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <DialogTitle className="text-2xl font-black mb-1">Edit {selectedRole?.name}</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Customize specific permissions for this role.</DialogDescription>
              </div>
              <ShieldCheck className="absolute -bottom-10 -right-10 h-48 w-48 text-white opacity-5 rotate-12" />
            </div>
            
            <div className="p-8">
              <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 mb-6 border border-amber-100">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 font-medium">Standard baseline permissions for the <strong>{selectedRole?.base_role}</strong> template are always active. Select additional overrides below.</p>
              </div>

              <ScrollArea className="h-[400px] border border-slate-100 rounded-3xl bg-slate-50/50 p-4">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(
                    permissions.reduce((acc: any, p: any) => {
                      const cat = p.category || 'legacy';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(p);
                      return acc;
                    }, {})
                  ).map(([category, catPerms]: [string, any]) => (
                    <div key={category} className="space-y-2 mb-6 last:mb-0">
                      <Badge variant="outline" className="bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 border-none mb-2 px-3">
                        {(t as any)(`category_${category}`) || category.toUpperCase()}
                      </Badge>
                      {catPerms.map((perm: any) => (
                        <div 
                          key={perm.id} 
                          className={`group flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                            selectedPermissions.includes(perm.id) 
                              ? 'bg-white border-2 border-indigo-600 shadow-md shadow-indigo-100' 
                              : 'bg-white/50 border border-slate-100'
                          }`}
                          onClick={() => togglePermission(perm.id)}
                        >
                          <div className="flex gap-3 items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                               selectedPermissions.includes(perm.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">
                                {(t as any)(`permission_${perm.name}`) || perm.name.replace(/_/g, ' ').toUpperCase()}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">{perm.description}</p>
                            </div>
                          </div>
                          <Checkbox 
                            checked={selectedPermissions.includes(perm.id)} 
                            onCheckedChange={() => togglePermission(perm.id)}
                            className="rounded-full h-5 w-5"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="bg-slate-50/80 p-6 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={() => updatePermissionsMutation.mutate({ 
                  roleId: selectedRole.id, 
                  permissions: selectedPermissions 
                })} 
                disabled={updatePermissionsMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px] rounded-2xl font-black h-12"
              >
                {updatePermissionsMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Update Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default RolesPage;
