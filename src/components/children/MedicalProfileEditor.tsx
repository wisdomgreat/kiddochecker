import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Stethoscope,
    Pill,
    AlertTriangle,
    Heart,
    Save,
    Loader2,
    Info,
    Phone,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface MedicalProfileEditorProps {
    childId: string;
    childName: string;
}

const MedicalProfileEditor = ({ childId, childName }: MedicalProfileEditorProps) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user, isAdmin, isParent } = useAuth();
    const [canEdit, setCanEdit] = useState(false);
    const [medicalData, setMedicalData] = useState<any>({
        allergies: [],
        medications: [],
        conditions: [],
        dietary_restrictions: '',
        blood_type: '',
        emergency_notes: '',
        doctor_name: '',
        doctor_phone: '',
        insurance_provider: '',
        insurance_number: ''
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchMedicalProfile();
    }, [childId]);

    const fetchMedicalProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('child_medical_profiles' as any) as any)
                .select('*')
                .eq('child_id', childId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setMedicalData({
                    child_id: data.child_id,
                    allergies: Array.isArray(data.allergies) ? data.allergies : [],
                    medications: Array.isArray(data.medications) ? data.medications : [],
                    conditions: Array.isArray(data.conditions) ? data.conditions : [],
                    dietary_restrictions: data.dietary_restrictions || '',
                    blood_type: data.blood_type || '',
                    emergency_notes: data.emergency_notes || '',
                    doctor_name: data.doctor_name || '',
                    doctor_phone: data.doctor_phone || '',
                    insurance_provider: data.insurance_provider || '',
                    insurance_number: data.insurance_number || ''
                });
            }

            // Check if user is allowed to edit this specific child
            const { data: childData } = await supabase
                .from('children')
                .select('parent_id')
                .eq('id', childId)
                .single();

            setCanEdit(isAdmin || (isParent && childData?.parent_id === user?.id));
        } catch (error: any) {
            console.error('Error fetching medical profile:', error);
            toast({
                title: "Error",
                description: "Failed to load medical profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await (supabase
                .from('child_medical_profiles' as any) as any)
                .upsert({
                    ...medicalData,
                    child_id: childId,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Medical profile updated successfully",
            });
        } catch (error: any) {
            console.error('Error saving medical profile:', error);
            toast({
                title: "Error",
                description: "Failed to save medical profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const addItem = (field: 'allergies' | 'medications' | 'conditions', newItem: any) => {
        setMedicalData((prev: any) => ({
            ...prev,
            [field]: [...prev[field], newItem]
        }));
    };

    const removeItem = (field: 'allergies' | 'medications' | 'conditions', index: number) => {
        setMedicalData((prev: any) => ({
            ...prev,
            [field]: prev[field].filter((_: any, i: number) => i !== index)
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Medical Profile</h2>
                    <p className="text-slate-500">Managing health records for {childName}</p>
                </div>
                {canEdit && (
                    <Button onClick={handleSave} disabled={saving} className="shadow-lg bg-indigo-600 hover:bg-indigo-700">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                )}
            </div>

            {!canEdit && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 text-amber-900 shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <ShieldAlert className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold">View-Only Access</p>
                        <p className="text-sm text-amber-700">Health information is sensitive. Only administrators and the child's primary parent/guardian can edit these records. Teachers have access to view this data for safety during class.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allergies Section */}
                <Card className="border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Allergies
                        </CardTitle>
                        <CardDescription>Known allergies and reactions</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {medicalData.allergies.map((allergy: any, index: number) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-red-900 capitalize">{allergy.type}</span>
                                        <Badge variant={allergy.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                            {allergy.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-red-700">Reaction: {allergy.reaction}</p>
                                </div>
                                {canEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => removeItem('allergies', index)} className="text-red-400 hover:text-red-600 hover:bg-red-100">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {canEdit && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Type (e.g. Peanuts)" id="new-allergy-type" className="text-sm" />
                                <Button variant="outline" size="sm" onClick={() => {
                                    const type = (document.getElementById('new-allergy-type') as HTMLInputElement).value;
                                    if (type) {
                                        addItem('allergies', { type, severity: 'moderate', reaction: 'N/A' });
                                        (document.getElementById('new-allergy-type') as HTMLInputElement).value = '';
                                    }
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Allergy
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Medications Section */}
                <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-indigo-50/50">
                        <CardTitle className="text-indigo-700 flex items-center gap-2">
                            <Pill className="h-5 w-5" />
                            Medications
                        </CardTitle>
                        <CardDescription>Current prescriptions and dosage</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {medicalData.medications.map((med: any, index: number) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="space-y-1">
                                    <span className="font-bold text-indigo-900">{med.name}</span>
                                    <p className="text-xs text-indigo-700">{med.dosage} - {med.frequency}</p>
                                </div>
                                {canEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => removeItem('medications', index)} className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {canEdit && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Name" id="new-med-name" className="text-sm" />
                                <Button variant="outline" size="sm" onClick={() => {
                                    const name = (document.getElementById('new-med-name') as HTMLInputElement).value;
                                    if (name) {
                                        addItem('medications', { name, dosage: 'N/A', frequency: 'N/A' });
                                        (document.getElementById('new-med-name') as HTMLInputElement).value = '';
                                    }
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Med
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vital Info Section */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-rose-500" />
                            Vital Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="blood-type">Blood Type</Label>
                                <Input
                                    id="blood-type"
                                    value={medicalData.blood_type}
                                    onChange={(e) => setMedicalData({ ...medicalData, blood_type: e.target.value })}
                                    placeholder="e.g. O+"
                                    disabled={!canEdit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctor-name">Doctor Name</Label>
                                <Input
                                    id="doctor-name"
                                    value={medicalData.doctor_name}
                                    onChange={(e) => setMedicalData({ ...medicalData, doctor_name: e.target.value })}
                                    placeholder="Dr. Smith"
                                    disabled={!canEdit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctor-phone">Doctor Phone</Label>
                                <div className="relative">
                                    <Input
                                        id="doctor-phone"
                                        value={medicalData.doctor_phone}
                                        onChange={(e) => setMedicalData({ ...medicalData, doctor_phone: e.target.value })}
                                        placeholder="Phone number"
                                        className="pl-9"
                                        disabled={!canEdit}
                                    />
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="insurance-provider">Insurance Provider</Label>
                                <Input
                                    id="insurance-provider"
                                    value={medicalData.insurance_provider}
                                    onChange={(e) => setMedicalData({ ...medicalData, insurance_provider: e.target.value })}
                                    placeholder="Provider name"
                                    disabled={!canEdit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="insurance-number">Insurance Policy #</Label>
                                <Input
                                    id="insurance-number"
                                    value={medicalData.insurance_number}
                                    onChange={(e) => setMedicalData({ ...medicalData, insurance_number: e.target.value })}
                                    placeholder="Policy number"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
                            <Input
                                id="dietary-restrictions"
                                value={medicalData.dietary_restrictions}
                                onChange={(e) => setMedicalData({ ...medicalData, dietary_restrictions: e.target.value })}
                                placeholder="e.g. Halal, Vegan, No Dairy..."
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency-notes">Emergency & Health Notes</Label>
                            <Textarea
                                id="emergency-notes"
                                rows={4}
                                value={medicalData.emergency_notes}
                                onChange={(e) => setMedicalData({ ...medicalData, emergency_notes: e.target.value })}
                                placeholder="Ex: Surgery history, developmental notes..."
                                className="resize-none"
                                disabled={!canEdit}
                            />
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
                                <Info className="h-4 w-4 flex-shrink-0" />
                                <p>These notes are only visible to administrators and assigned teachers.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MedicalProfileEditor;

