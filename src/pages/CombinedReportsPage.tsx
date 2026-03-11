import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedReportsPage from './EnhancedReportsPage';
import SystemHealth from './SystemHealth';
import AuditLogPage from './AuditLogPage';
import { BarChart3, HeartPulse, Activity } from 'lucide-react';

const CombinedReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" /> Reports & System Logs
        </h1>
        <p className="text-muted-foreground">Comprehensive overview of system analytics, health, and audit trails.</p>
      </div>
      
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full md:w-auto overflow-x-auto flex whitespace-nowrap justify-start">
          <TabsTrigger value="reports" className="flex items-center gap-2 rounded-xl">
            <BarChart3 className="h-4 w-4" /> Operations Reports
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2 rounded-xl">
            <HeartPulse className="h-4 w-4" /> System Health
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2 rounded-xl">
            <Activity className="h-4 w-4" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="m-0 border-none p-0 outline-none">
          <div className="-mx-8 -my-6">
            <EnhancedReportsPage isEmbedded={true} />
          </div>
        </TabsContent>

        <TabsContent value="health" className="m-0 border-none p-0 outline-none">
          <div className="-mx-8 -my-6">
            <SystemHealth isEmbedded={true} />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="m-0 border-none p-0 outline-none">
          <div className="-mx-8 -my-6">
            <AuditLogPage isEmbedded={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// If used independently, wrap in UnifiedDashboardLayout
export default function CombinedReportsWrapper() {
  return (
    <UnifiedDashboardLayout>
      <CombinedReportsPage />
    </UnifiedDashboardLayout>
  );
}
