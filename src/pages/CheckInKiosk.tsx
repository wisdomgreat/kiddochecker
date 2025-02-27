
import { useState } from "react";
import { QrCode, User, Phone, Search, AlertTriangle, Info } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";

// Define types for check-in data
interface CheckInItem {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
  actions?: string;
}

// Mock data for recent check-ins
const recentCheckIns: CheckInItem[] = [
  { id: "1", name: "Emma Wilson", class: "Preschool Class", status: "Checked in", time: "9:45 AM" },
  { id: "2", name: "Noah Johnson", class: "Elementary Class", status: "Checked in", time: "9:48 AM" },
  { id: "3", name: "Ava Davis", class: "Preschool Class", status: "Checked in", time: "9:50 AM" },
];

const CheckInKiosk = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"phone" | "children" | "confirmation">("phone");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  // Mock data for children associated with a parent
  const availableChildren = [
    { id: "1", name: "Emma Wilson", age: 4, class: "Preschool Class" },
    { id: "2", name: "Jack Wilson", age: 6, class: "Elementary Class" },
  ];

  const handlePhoneSubmit = () => {
    // In a real application, this would verify the phone number
    // and load the associated children
    console.log("Phone submitted:", phoneNumber);
    setStep("children");
  };

  const handleChildSelection = (childId: string) => {
    setSelectedChildren((prev) => {
      if (prev.includes(childId)) {
        return prev.filter((id) => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  const handleConfirmCheckIn = () => {
    console.log("Children checked in:", selectedChildren);
    setStep("confirmation");
    // In a real app, this would submit the check-in to the server
  };

  const handleRestart = () => {
    setPhoneNumber("");
    setSelectedChildren([]);
    setStep("phone");
  };

  const checkInColumns = [
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
      render: (_: any, item: CheckInItem) => (
        <button className="p-1 rounded-full hover:bg-gray-100">
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
        </button>
      ),
    },
  ];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Check-in Kiosk" },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Check-in Kiosk</h1>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
        {step === "phone" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <Phone size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Enter Parent Phone Number</h2>
                <p className="text-gray-600">
                  Please enter your phone number to check in your children.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., 555-123-4567)"
                  className="input-field text-lg py-3"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Phone size={20} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                className="btn-primary flex-1 py-3 text-lg"
                onClick={handlePhoneSubmit}
                disabled={!phoneNumber}
              >
                Next
              </button>
              <button className="btn-secondary py-3 text-lg">
                Scan QR Code
              </button>
            </div>
          </div>
        )}
        
        {step === "children" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-purple-100 p-3">
                <User size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Select Children to Check In</h2>
                <p className="text-gray-600">
                  Please select which children you'd like to check in today.
                </p>
              </div>
            </div>
            
            <div className="mb-6 space-y-4">
              {availableChildren.map((child) => (
                <div 
                  key={child.id}
                  className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors duration-200 ${
                    selectedChildren.includes(child.id)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onClick={() => handleChildSelection(child.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{child.name}</h3>
                    <p className="text-sm text-gray-500">
                      Age {child.age} • {child.class}
                    </p>
                  </div>
                  <div>
                    <div className={`w-6 h-6 rounded-full border ${
                      selectedChildren.includes(child.id)
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300"
                    } flex items-center justify-center`}>
                      {selectedChildren.includes(child.id) && (
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
                          className="text-white"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                className="btn-primary flex-1 py-3 text-lg"
                onClick={handleConfirmCheckIn}
                disabled={selectedChildren.length === 0}
              >
                Check In Selected Children
              </button>
              <button 
                className="btn-secondary py-3 text-lg"
                onClick={() => setStep("phone")}
              >
                Back
              </button>
            </div>
          </div>
        )}
        
        {step === "confirmation" && (
          <div className="text-center">
            <div className="rounded-full bg-green-100 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Check-in Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your children have been checked in. Please take their name tags and proceed to their assigned classrooms.
            </p>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-lg mb-2">Check-in Summary</h3>
              {availableChildren
                .filter(child => selectedChildren.includes(child.id))
                .map(child => (
                  <div key={child.id} className="mb-2 last:mb-0">
                    <div className="font-medium">{child.name}</div>
                    <div className="text-sm text-gray-600">{child.class}</div>
                  </div>
                ))
              }
            </div>
            
            <button
              className="btn-primary py-3 text-lg w-full"
              onClick={handleRestart}
            >
              Done
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Check-ins</h2>
        <DataTable
          columns={checkInColumns}
          data={recentCheckIns}
          keyExtractor={(item) => item.id}
        />
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Info size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1">Need Assistance?</h2>
            <p className="text-gray-600 mb-4">
              If you're having trouble with the check-in process, please speak with a staff member for help.
            </p>
            <button className="btn-primary">Request Help</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckInKiosk;
