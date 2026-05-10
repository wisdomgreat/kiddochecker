import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import {
    Database,
    Trash2,
    RefreshCw,
    Loader2,
    AlertTriangle,
    FileSearch
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
            const { data: dbDocs, error: dbError } = await (supabase
                .from('staff_documents' as any) as any)
                .select('file_path');

            if (dbError) throw dbError;
            const validPaths = new Set(dbDocs?.map(d => d.file_path).filter(Boolean));

            const { data: folders, error: foldersError } = await supabase.storage
                .from('staff-documents')
                .list();

            if (foldersError) throw foldersError;

            let deletedCount = 0;
            for (const folder of (folders || [])) {
                if (folder.id === null) {
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
            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Data Migration
                    </CardTitle>
                    <CardDescription>
                        Migrate medical data from legacy fields to the new structured format.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-md bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-bold mb-1">Important</p>
                            <p>This will copy data from old 'Allergies' and 'Medical Info' fields. Existing structured data won't be overwritten.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleMigration}
                        disabled={migrating}
                    >
                        {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Start Medical Migration
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-primary" />
                        Storage Cleanup
                    </CardTitle>
                    <CardDescription>
                        Identify and remove orphaned files in the 'staff-documents' bucket.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Files in storage that aren't linked to any document record in the database will be permanently deleted.
                    </p>
                    <Button
                        variant="outline"
                        onClick={handleStorageCleanup}
                        disabled={cleaning}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
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

