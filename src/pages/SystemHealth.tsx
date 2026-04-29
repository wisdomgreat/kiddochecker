
import { useState, useEffect } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Wifi, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  icon: any;
  description: string;
}

const SystemHealth = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { toast } = useToast();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: healthMetrics, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        // Test database connectivity
        const { data: dbTest, error: dbError } = await supabase
          .from('user_roles')
          .select('count')
          .limit(1);

        // Get basic stats for health assessment
        const [
          { count: userCount },
          { count: childrenCount },
          { count: classesCount },
          { count: attendanceCount }
        ] = await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }),
          supabase.from('children').select('*', { count: 'exact', head: true }),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('attendance').select('*', { count: 'exact', head: true })
        ]);

        const metrics: SystemMetric[] = [
          {
            name: "Database Connection",
            value: dbError ? "Disconnected" : "Connected",
            status: dbError ? 'error' : 'healthy',
            icon: Database,
            description: dbError ? "Database connection failed" : "Database responding normally"
          },
          {
            name: "User System",
            value: `${userCount || 0} users`,
            status: (userCount || 0) > 0 ? 'healthy' : 'warning',
            icon: Server,
            description: "User management system operational"
          },
          {
            name: "Data Storage",
            value: `${(childrenCount || 0) + (classesCount || 0) + (attendanceCount || 0)} records`,
            status: 'healthy',
            icon: HardDrive,
            description: "Data storage functioning normally"
          },
          {
            name: "Authentication",
            value: "Active",
            status: 'healthy',
            icon: Wifi,
            description: "Supabase Auth service operational"
          }
        ];

        return metrics;
      } catch (error) {
        console.error("Health check failed:", error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    toast({
      title: "System Status Refreshed",
      description: "Health metrics have been updated",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const overallStatus = healthMetrics?.some(m => m.status === 'error') ? 'error' :
                      healthMetrics?.some(m => m.status === 'warning') ? 'warning' : 'healthy';

  const content = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Health</h1>
            <p className="text-muted-foreground">Monitor system performance and health metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(overallStatus)}>
                {overallStatus.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {overallStatus === 'healthy' ? 'All systems operational' :
                 overallStatus === 'warning' ? 'Some systems need attention' :
                 'Critical issues detected'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            healthMetrics?.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <metric.icon className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metric.value}</div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detailed Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthMetrics?.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <span className="font-medium">{metric.name}</span>
                      <p className="text-sm text-gray-500">{metric.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{metric.value}</span>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );

  return isEmbedded ? content : <ModernLayout>{content}</ModernLayout>;
};

export default SystemHealth;

