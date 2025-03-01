
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { CheckoutItem } from "./SearchForm";

interface CheckoutTableProps {
  data: CheckoutItem[];
  title: string;
  loading?: boolean;
  onCheckout?: (attendanceId: string) => void;
  showClearButton?: boolean;
  onClear?: () => void;
}

const CheckoutTable = ({ 
  data, 
  title, 
  loading = false, 
  onCheckout,
  showClearButton = false,
  onClear
}: CheckoutTableProps) => {
  const checkoutColumns = [
    {
      key: "name" as const,
      header: "Child",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <User size={20} className="text-gray-500" />
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { key: "status" as const, header: "Status" },
    { key: "time" as const, header: "Time" },
    {
      key: "actions" as const,
      header: "",
      render: (_: any, item: CheckoutItem) => (
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          onClick={() => onCheckout && onCheckout(item.attendance_id)}
          disabled={item.status === "Checked out"}
        >
          {item.status === "Checked out" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800"
            >
              Check out
            </Button>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {showClearButton && onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear Results
          </Button>
        )}
      </div>
      <DataTable
        columns={checkoutColumns}
        data={data}
        keyExtractor={(item) => item.id}
        loading={loading}
      />
    </div>
  );
};

export default CheckoutTable;
