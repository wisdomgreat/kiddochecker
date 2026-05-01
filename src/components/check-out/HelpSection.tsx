
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const HelpSection = () => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-100 p-2">
          <Info size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold mb-1">Need Assistance?</h2>
          <div className="text-gray-600 text-sm space-y-2 mb-4">
            <p>• You can check out by scanning your <strong>Parent Claim Ticket</strong> at any kiosk.</p>
            <p>• If you don't have your ticket, use the <strong>Self Check-Out</strong> tab with your Phone & PIN.</p>
            <p>• For lost PINs or tickets, please ask a staff member for a <strong>Manual Override</strong>.</p>
          </div>
          <Button variant="default" className="font-bold">Message Staff</Button>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;

