import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import StaffSchedules from '@/components/staff/StaffSchedules';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Layout, Sparkles } from "lucide-react";
import RosterTemplates from '@/components/staff/RosterTemplates';

const StaffSchedulesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="live" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl h-14 border border-slate-200 dark:border-white/5 shadow-inner">
              <TabsTrigger value="live" className="rounded-[1.25rem] px-8 h-11 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
                <CalendarDays className="h-4 w-4" /> Live Roster
              </TabsTrigger>
              <TabsTrigger value="templates" className="rounded-[1.25rem] px-8 h-11 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
                <Sparkles className="h-4 w-4" /> Roster Blueprints
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="live" className="mt-0 focus-visible:outline-none">
            <StaffSchedules />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0 focus-visible:outline-none">
            <RosterTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default StaffSchedulesPage;
