
import { User, QrCode, UsersRound, AlertTriangle } from "lucide-react";
import StatCard from "@/components/ui/stat-card";
import { DashboardStats } from "@/hooks/useDashboardData";

interface StatCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

const StatCards = ({ stats, isLoading }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="TODAY"
        value={isLoading ? "..." : String(stats?.checkedIn || 0)}
        description="Children checked in"
        icon={<User size={24} />}
        actionLabel="View Details"
      />
      
      <StatCard
        title="TODAY"
        value={isLoading ? "..." : String(stats?.checkedOut || 0)}
        description="Children checked out"
        icon={<QrCode size={24} />}
        actionLabel="View Details"
      />
      
      <StatCard
        title="ACTIVE"
        value={isLoading ? "..." : String(stats?.classes || 0)}
        description="Classes in session"
        icon={<UsersRound size={24} />}
        actionLabel="Manage Classes"
      />
      
      <StatCard
        title="ALERTS"
        value={isLoading ? "..." : String(stats?.alerts || 0)}
        description="Requires attention"
        icon={<AlertTriangle size={24} />}
        actionLabel="Resolve Issues"
      />
    </div>
  );
};

export default StatCards;
