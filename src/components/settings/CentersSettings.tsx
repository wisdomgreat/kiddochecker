
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Globe, MapPin, Save, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

interface Center {
    id: string;
    name: string;
    address: string;
    city: string;
    state_province: string;
    latitude: number;
    longitude: number;
    phone: string;
    email: string;
    is_active: boolean;
}

const CentersSettings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { settings, updateSettings } = useSettings();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Center>>({
        name: '',
        address: '',
        city: '',
        state_province: '',
        latitude: 0,
        longitude: 0,
        phone: '',
        email: '',
        is_active: true
    });

    const { data: centers, isLoading } = useQuery({
        queryKey: ['centers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('centers')
                .select('*')
                .order('name');
            if (error) throw error;
            return data as Center[];
        }
    });

    const addCenterMutation = useMutation({
        mutationFn: async (newCenter: Partial<Center>) => {
            const { error } = await supabase.from('centers').insert([newCenter]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['centers'] });
            toast({ title: "Center added", description: "Successfully added new location." });
            setIsAdding(false);
            resetForm();
        }
    });

    const updateCenterMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Center> }) => {
            const { error } = await supabase.from('centers').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['centers'] });
            toast({ title: "Center updated", description: "Successfully updated location details." });
            setEditingId(null);
            resetForm();
        }
    });

    const deleteCenterMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('centers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['centers'] });
            toast({ title: "Center deleted", description: "Successfully removed location." });
        }
    });

    const resetForm = () => {
        setFormData({ name: '', address: '', city: '', state_province: '', latitude: 0, longitude: 0, phone: '', email: '', is_active: true });
    };

    const handleSave = () => {
        if (!formData.name || !formData.city) {
            toast({ title: "Error", description: "Name and City are required", variant: "destructive" });
            return;
        }

        if (editingId) {
            updateCenterMutation.mutate({ id: editingId, data: formData });
        } else {
            addCenterMutation.mutate(formData);
        }
    };

    const handleEdit = (center: Center) => {
        setFormData(center);
        setEditingId(center.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-10">
            {/* Global Visibility Toggle */}
            <Card className="bg-slate-50 dark:bg-white/5 border-none rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-500/20">
                            <Globe className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Public Location Page</h3>
                            <p className="text-sm font-medium text-slate-400">Toggle "Center Finder" visibility for users on search screens.</p>
                        </div>
                    </div>
                    <Switch 
                        checked={settings?.show_center_finder ?? true} 
                        onCheckedChange={(val) => updateSettings({ show_center_finder: val })}
                    />
                </CardContent>
            </Card>

            {/* List and Management */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Managed Locations</h3>
                    </div>
                    <Button 
                        onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 px-5 gap-2"
                        disabled={isAdding}
                    >
                        <Plus className="h-4 w-4" /> Add Location
                    </Button>
                </div>

                {isAdding && (
                    <Card className="bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] overflow-hidden ring-2 ring-indigo-500/20">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-bold">{editingId ? 'Edit Location' : 'New Location'}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Location Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Toronto Central Branch" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Street Address</Label>
                                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Church St" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">City</Label>
                                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Toronto" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">State / Province</Label>
                                    <Input value={formData.state_province} onChange={e => setFormData({...formData, state_province: e.target.value})} placeholder="Ontario" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Phone</Label>
                                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Email</Label>
                                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@grace.ca" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Latitude</Label>
                                    <Input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">Longitude</Label>
                                    <Input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none px-4" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                                <Button onClick={handleSave} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold gap-2">
                                    <Save className="h-4 w-4" /> {editingId ? 'Save Changes' : 'Create location'}
                                </Button>
                                <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-12 rounded-xl font-bold gap-2">
                                    <X className="h-4 w-4" /> Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        [1,2].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)
                    ) : centers?.map(center => (
                        <Card key={center.id} className="p-6 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{center.name}</h4>
                                        <p className="text-xs font-medium text-slate-400">{center.address}, {center.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 rounded-xl" onClick={() => handleEdit(center)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-600 rounded-xl" onClick={() => deleteCenterMutation.mutate(center.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {!isLoading && centers?.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                            <MapPin className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Locations Configured</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CentersSettings;
