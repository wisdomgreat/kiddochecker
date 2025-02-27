
import { useState } from "react";
import { QrCode, User, Calendar, Clock, Info } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";

// Define the type for checkout data
interface CheckoutItem {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
  actions?: string; // Add this property to match the column key
}

// Mock data for recent check-outs
const recentCheckouts: CheckoutItem[] = [
  { id: "1", name: "Olivia Smith", class: "Toddler Class", status: "Checked out", time: "11:30 AM" },
  { id: "2", name: "Liam Brown", class: "Elementary Class", status: "Checked out", time: "11:32 AM" },
  { id: "3", name: "Sophia Martinez", class: "Preschool Class", status: "Checked out", time: "11:45 AM" },
];

const CheckOutStation = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [childName, setChildName] = useState("");
  
  const handleSearch = () => {
    console.log("Searching for:", { phoneNumber, childName });
    // In a real app, this would search the database
  };
  
  const handleReset = () => {
    setPhoneNumber("");
    setChildName("");
  };
  
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
      key: "actions" as const, // This will now match the property in the CheckoutItem type
      header: "",
      render: (_: any, item: CheckoutItem) => ( // Accept the item as second parameter
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
          { label: "Check-out Station" },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Check-out Station</h1>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full bg-purple-100 p-3">
            <QrCode size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Scan Parent QR Code</h2>
            <p className="text-gray-600">
              Please ask the parent to present their QR code for scanning to check out their child.
            </p>
          </div>
        </div>
        
        <button className="btn-primary mt-4">Manual Override</button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Check-outs</h2>
        <DataTable
          columns={checkoutColumns}
          data={recentCheckouts}
          keyExtractor={(item) => item.id}
        />
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Manual Check-out</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                className="input-field"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
                  className="text-gray-400"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name
            </label>
            <div className="relative">
              <input
                id="childName"
                type="text"
                placeholder="Enter child's name"
                className="input-field"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
                  className="text-gray-400"
                >
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              className="btn-primary flex-1"
              onClick={handleSearch}
              disabled={!phoneNumber && !childName}
            >
              Search
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
      
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
            <button className="btn-primary">Contact Admin</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckOutStation;
