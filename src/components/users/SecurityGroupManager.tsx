
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Plus, Trash2, Loader2, Lock } from 'lucide-react';
import { SecurityGroupService } from '@/services/securityGroupService';
import { useToast } from '@/hooks/use-toast';

export const SecurityGroupManager = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await SecurityGroupService.getGroups();
            setGroups(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                    <Card key={group.id} className="shadow-sm border-2 hover:border-primary/20 transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black uppercase">
                                    {group.group_permissions?.length || 0} PERMS
                                </Badge>
                            </div>
                            <CardTitle className="text-xl mt-4 font-bold">{group.name}</CardTitle>
                            <CardDescription className="text-xs">{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {group.group_permissions?.map((gp: any, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-[9px] font-medium bg-slate-100 text-slate-600 border-none">
                                            {gp.permissions?.name}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="pt-4 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Members Only</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2">
                                        <Lock className="h-3 w-3" /> Manage
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
