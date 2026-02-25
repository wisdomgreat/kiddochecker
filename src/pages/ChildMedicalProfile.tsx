import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import MedicalProfileEditor from '@/components/children/MedicalProfileEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';

const ChildMedicalProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { children } = useChildren();

    const child = children?.find((c: any) => c.id === id);

    if (!id) return null;

    return (
        <UnifiedDashboardLayout>
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Staff
                </Button>

                <MedicalProfileEditor
                    childId={id}
                    childName={child ? `${child.first_name} ${child.last_name}` : 'the child'}
                />
            </div>
        </UnifiedDashboardLayout>
    );
};

export default ChildMedicalProfile;
