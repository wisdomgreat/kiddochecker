import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import StaffSchedules from '@/components/staff/StaffSchedules';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, Clock, Layout, Sparkles } from "lucide-react";
import RosterTemplates from '@/components/staff/RosterTemplates';

const StaffSchedulesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="live" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-slate-100 dark:bg-slate-900 border-none h-14 p-1.5 rounded-2xl shadow-inner mb-8">
            <TabsTrigger value="live" className="rounded-xl px-10 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2 h-11">
              <Calendar className="h-4 w-4" /> Live Schedule
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl px-10 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2 h-11">
              <Clock className="h-4 w-4" /> Weekly Templates
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
