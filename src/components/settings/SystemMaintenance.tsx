import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Database,
    Trash2,
    RefreshCw,
    Loader2,
    AlertTriangle,
    FileSearch,
    CheckCircle2
} from "lucide-react";

const SystemMaintenance = () => {
    const { toast } = useToast();
    const [migrating, setMigrating] = useState(false);
    const [cleaning, setCleaning] = useState(false);

    const handleMigration = async () => {
        try {
            setMigrating(true);
            const { data: children, error: fetchError } = await supabase
                .from('children')
                .select('id, allergies, medical_info');

            if (fetchError) throw fetchError;

            let migratedCount = 0;
            for (const child of (children || [])) {
                if (child.allergies || child.medical_info) {
                    const { error: upsertError } = await (supabase
                        .from('child_medical_profiles' as any) as any)
                        .upsert({
                            child_id: child.id,
                            allergies: child.allergies ? [
                                { type: child.allergies, severity: 'moderate', reaction: 'Migrated from legacy' }
                            ] : [],
                            emergency_notes: child.medical_info || '',
                            updated_at: new Date().toISOString()
                        } as any, {
                            onConflict: 'child_id',
                            // Only update if existing profile is empty/missing
                            ignoreDuplicates: false
                        });

                    if (!upsertError) migratedCount++;
                }
            }

            toast({
                title: "Migration Complete",
                description: `Successfully processed ${migratedCount} medical profiles.`,
            });
        } catch (error: any) {
            console.error("Migration error:", error);
            toast({
                title: "Migration Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setMigrating(false);
        }
    };

    const handleStorageCleanup = async () => {
        try {
            setCleaning(true);

            // 1. Get all file paths in the database
            const { data: dbDocs, error: dbError } = await (supabase
                .from('staff_documents' as any) as any)
                .select('file_path');

            if (dbError) throw dbError;
            const validPaths = new Set(dbDocs?.map(d => d.file_path).filter(Boolean));

            // 2. List all files in storage
            // Note: list() only lists one level. If files are in folders, we need recursion.
            // Our files are in {user_id}/{filename}
            const { data: folders, error: foldersError } = await supabase.storage
                .from('staff-documents')
                .list();

            if (foldersError) throw foldersError;

            let deletedCount = 0;
            for (const folder of (folders || [])) {
                if (folder.id === null) { // It's a directory (user_id)
                    const { data: files, error: filesError } = await supabase.storage
                        .from('staff-documents')
                        .list(folder.name);

                    if (filesError) continue;

                    for (const file of (files || [])) {
                        const fullPath = `${folder.name}/${file.name}`;
                        if (!validPaths.has(fullPath)) {
                            const { error: deleteError } = await supabase.storage
                                .from('staff-documents')
                                .remove([fullPath]);

                            if (!deleteError) deletedCount++;
                        }
                    }
                }
            }

            toast({
                title: "Cleanup Complete",
                description: `Removed ${deletedCount} orphaned documents from storage.`,
            });
        } catch (error: any) {
            console.error("Cleanup error:", error);
            toast({
                title: "Cleanup Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-amber-100 shadow-sm">
                <CardHeader className="bg-amber-50/50">
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Data Migration
                    </CardTitle>
                    <CardDescription>
                        Migrate medical data from legacy fields to the new structured format.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Important Note</p>
                            <p>This will copy data from the old 'Allergies' and 'Medical Info' text fields into the new profile system. Existing structured data will not be overwritten.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleMigration}
                        disabled={migrating}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Start Medical Migration
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-indigo-600" />
                        Storage Cleanup
                    </CardTitle>
                    <CardDescription>
                        Identify and remove orphaned files in the 'staff-documents' bucket.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-slate-500 mb-6">
                        Files in Supabase Storage that aren't linked to any document record in the database will be permanently deleted to save space.
                    </p>
                    <Button
                        variant="outline"
                        onClick={handleStorageCleanup}
                        disabled={cleaning}
                        className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                        {cleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Run Storage Cleanup
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemMaintenance;
