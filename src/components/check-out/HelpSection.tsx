
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const HelpSection = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-100 p-2">
          <Info size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold mb-1">Need Assistance?</h2>
          <p className="text-gray-600 mb-4">
            If you're having trouble with the check-out process, please contact a staff member or administrator for help.
          </p>
          <Button variant="default">Contact Admin</Button>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
