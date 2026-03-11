import React, { useState } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Baby, UserCheck, Shield } from 'lucide-react';
import UsersPage from './UsersPage';
import StaffPage from './StaffPage';
import ChildrenPage from './ChildrenPage';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';

const PeopleManagementPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
      <UnifiedDashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">People Management</h1>
              <p className="text-slate-500 font-medium">Centralized directory for all organization members.</p>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full md:w-auto h-auto gap-1">
              <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all gap-2">
                <Users className="h-4 w-4" /> All Users
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all gap-2">
                <UserCheck className="h-4 w-4" /> Staff & Volunteers
              </TabsTrigger>
              <TabsTrigger value="children" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all gap-2">
                <Baby className="h-4 w-4" /> Children
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-0 border-none p-0 outline-none">
                {/* We wrap the existing pages but since they already include the layout, we need to modify them to be embeddable */}
                <UsersPage isEmbedded={true} />
            </TabsContent>
            <TabsContent value="staff" className="mt-0 border-none p-0 outline-none">
                <StaffPage isEmbedded={true} />
            </TabsContent>
            <TabsContent value="children" className="mt-0 border-none p-0 outline-none">
                <ChildrenPage isEmbedded={true} />
            </TabsContent>
          </Tabs>
        </div>
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default PeopleManagementPage;
