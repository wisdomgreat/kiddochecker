
import { User } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ActivityRecord } from "@/hooks/useDashboardData";

interface ActivityTableProps {
  activityData: ActivityRecord[];
  isLoading: boolean;
}

const ActivityTable = ({ activityData, isLoading }: ActivityTableProps) => {
  const activityColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2">
            <User size={16} className="text-purple-600" />
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { 
      key: "status" as const, 
      header: "Status",
      render: (value: string) => (
        <span className={value === "Checked in" ? "text-green-600" : "text-purple-600"}>
          {value}
        </span>
      ),
    },
    { key: "time" as const, header: "Time" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Activity</h2>
      </div>
      
      <DataTable
        columns={activityColumns}
        data={isLoading ? [] : activityData}
        keyExtractor={(item) => item.id}
        loading={isLoading}
      />
      
      <div className="mt-4 flex justify-center">
        <button className="btn-primary">View All Activity</button>
      </div>
    </div>
  );
};

export default ActivityTable;
