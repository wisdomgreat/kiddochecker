import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedReporting from '@/components/admin/EnhancedReporting';

const ReportsPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Forensic attendance audit and safety analytics</p>
          </div>
        </div>

        <EnhancedReporting />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default ReportsPage;

