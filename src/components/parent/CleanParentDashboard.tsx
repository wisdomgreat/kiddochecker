
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/CleanAuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Baby, Calendar, MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ComponentType<any>;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color = "blue" }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-${color}-500`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const CleanParentDashboard = () => {
  const { user, userRole } = useAuth();

  const { data: childrenCount, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["children-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("children")
        .select("*", { count: "exact", head: false })
        .eq("parent_id", user.id);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: upcomingEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["upcoming-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      // Replace with actual query for upcoming events
      return 5;
    },
  });

  const { data: unreadMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      // Replace with actual query for unread messages
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: false })
        .eq("recipient_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <Badge className="uppercase">{userRole}</Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="My Children"
          value={isLoadingChildren ? "Loading..." : childrenCount || 0}
          icon={Baby}
          color="green"
        />
        <DashboardCard
          title="Upcoming Events"
          value={isLoadingEvents ? "Loading..." : upcomingEvents || 0}
          icon={Calendar}
          color="yellow"
        />
        <DashboardCard
          title="Unread Messages"
          value={isLoadingMessages ? "Loading..." : unreadMessages || 0}
          icon={MessageSquare}
          color="red"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Button className="bg-blue-500 text-white hover:bg-blue-700">
              Check-In
            </Button>
            <Button className="bg-green-500 text-white hover:bg-green-700">
              Check-Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleanParentDashboard;
