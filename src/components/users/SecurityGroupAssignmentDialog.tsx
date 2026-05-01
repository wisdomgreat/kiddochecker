
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Save } from 'lucide-react';
import { SecurityGroupService } from '@/services/securityGroupService';
import { useToast } from '@/hooks/useToast';

interface Props {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const SecurityGroupAssignmentDialog = ({ user, open, onOpenChange, onSuccess }: Props) => {
    const [groups, setGroups] = useState<any[]>([]);
    const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open && user?.id) {
            loadData();
        }
    }, [open, user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [allGroups, assignedIds] = await Promise.all([
                SecurityGroupService.getGroups(),
                SecurityGroupService.getUserGroups(user.id)
            ]);
            setGroups(allGroups || []);
            setUserGroupIds(assignedIds || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleGroup = (groupId: string) => {
        setUserGroupIds(prev => 
            prev.includes(groupId) 
                ? prev.filter(id => id !== groupId) 
                : [...prev, groupId]
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // For simplicity, we just clear and re-add (though a diff would be cleaner)
            // But let's do a basic diff to avoid unnecessary DB noise
            const originalIds = await SecurityGroupService.getUserGroups(user.id);
            const toAdd = userGroupIds.filter(id => !originalIds.includes(id));
            const toRemove = originalIds.filter(id => !userGroupIds.includes(id));

            await Promise.all([
                ...toAdd.map(id => SecurityGroupService.assignUserToGroup(user.id, id)),
                ...toRemove.map(id => SecurityGroupService.removeUserFromGroup(user.id, id))
            ]);

            toast({ title: "Success", description: "Security groups updated successfully." });
            onSuccess();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-slate-950 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Privileges</span>
                        </div>
                        <DialogTitle className="text-2xl font-bold">{user?.firstName} {user?.lastName}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">Assign additive security groups to this user.</DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : (
                        <div className="space-y-3">
                            {groups.map((group) => (
                                <div key={group.id} className="flex items-start space-x-4 p-4 rounded-2xl border hover:bg-slate-50 transition-colors">
                                    <Checkbox 
                                        id={group.id} 
                                        checked={userGroupIds.includes(group.id)}
                                        onCheckedChange={() => handleToggleGroup(group.id)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor={group.id} className="text-sm font-bold cursor-pointer">{group.name}</label>
                                        <p className="text-xs text-muted-foreground">{group.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between">
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Additive permissions enabled</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-wider">Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Update
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
