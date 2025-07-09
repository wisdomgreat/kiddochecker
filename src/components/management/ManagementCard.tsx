
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ManagementCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  count?: number;
  status?: 'active' | 'inactive' | 'warning';
}

const ManagementCard = ({ title, description, icon: Icon, onClick, count, status }: ManagementCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'inactive': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${getStatusColor()}`} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {count !== undefined && (
            <span className="text-2xl font-bold text-gray-700">{count}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{description}</p>
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManagementCard;
