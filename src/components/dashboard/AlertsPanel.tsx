
import { AlertTriangle, MoreHorizontal } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
}

const alertsData = [
  { 
    id: "1", 
    type: "Allergy Alert", 
    message: "Noah Johnson - Peanut allergy", 
    severity: "high",
    timestamp: new Date()
  },
  { 
    id: "2", 
    type: "Teacher Request", 
    message: "Elementary Class needs assistance", 
    severity: "medium",
    timestamp: new Date()
  },
  { 
    id: "3", 
    type: "System Notice", 
    message: "Printer low on paper", 
    severity: "low",
    timestamp: new Date()
  },
];

const AlertsPanel = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Alerts & Notifications</h2>
      </div>
      
      <div className="space-y-4">
        {alertsData.map((alert) => (
          <div key={alert.id} className="glass-card p-4 rounded-lg">
            <div className="flex">
              <div className={`rounded-full p-2 mr-3 ${
                alert.severity === "high" 
                  ? "bg-red-100" 
                  : alert.severity === "medium"
                  ? "bg-orange-100"
                  : "bg-blue-100"
              }`}>
                <AlertTriangle size={20} className={`${
                  alert.severity === "high" 
                    ? "text-red-600" 
                    : alert.severity === "medium"
                    ? "text-orange-600"
                    : "text-blue-600"
                }`} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{alert.type}</h3>
                <p className="text-sm text-gray-600">{alert.message}</p>
              </div>
              
              <button className="rounded-full p-1 hover:bg-gray-100">
                <MoreHorizontal size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <button className="btn-primary">View All Alerts</button>
      </div>
    </div>
  );
};

export default AlertsPanel;
