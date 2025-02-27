
import { useState } from "react";
import { User, Calendar, Clock, AlertTriangle, Bell, Edit, Info, MoreHorizontal, QrCode } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";

interface Child {
  id: string;
  name: string;
  age: number;
  class: string;
  allergies: string[];
  notes: string;
  photoUrl?: string;
}

interface CheckInRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  class: string;
  notes?: string;
}

// Mock data for children
const childrenData: Child[] = [
  {
    id: "1",
    name: "Emma Wilson",
    age: 4,
    class: "Preschool Class",
    allergies: ["Peanuts"],
    notes: "Shy at first, but warms up quickly.",
    photoUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "2",
    name: "Jack Wilson",
    age: 6,
    class: "Elementary Class",
    allergies: [],
    notes: "Very energetic and social.",
    photoUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
];

// Mock data for check-in history
const checkInHistoryData: CheckInRecord[] = [
  {
    id: "1",
    childId: "1",
    childName: "Emma Wilson",
    date: "Oct 15, 2023",
    checkInTime: "9:30 AM",
    checkOutTime: "11:45 AM",
    class: "Preschool Class",
    notes: "Participated in group activities",
  },
  {
    id: "2",
    childId: "2",
    childName: "Jack Wilson",
    date: "Oct 15, 2023",
    checkInTime: "9:32 AM",
    checkOutTime: "11:47 AM",
    class: "Elementary Class",
  },
  {
    id: "3",
    childId: "1",
    childName: "Emma Wilson",
    date: "Oct 8, 2023",
    checkInTime: "9:28 AM",
    checkOutTime: "11:40 AM",
    class: "Preschool Class",
    notes: "Made a craft to take home",
  },
  {
    id: "4",
    childId: "2",
    childName: "Jack Wilson",
    date: "Oct 8, 2023",
    checkInTime: "9:28 AM",
    checkOutTime: "11:42 AM",
    class: "Elementary Class",
  },
];

// Mock data for announcements
const announcementsData = [
  {
    id: "1",
    title: "Fall Festival",
    date: "Oct 31, 2023",
    content: "Join us for our annual Fall Festival! There will be games, food, and fun activities for the whole family.",
    priority: "medium",
  },
  {
    id: "2",
    title: "Teacher Appreciation Week",
    date: "Nov 6-10, 2023",
    content: "Next week is Teacher Appreciation Week. Show your appreciation for your child's teachers!",
    priority: "low",
  },
  {
    id: "3", 
    title: "Allergy Alert: Snacks Update",
    date: "Starting Oct 22, 2023",
    content: "We're updating our snack policy to ensure all foods served are nut-free. Please check the new guidelines.",
    priority: "high",
  },
];

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState<"children" | "history" | "settings">("children");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  const historyColumns = [
    {
      key: "childName" as const,
      header: "Child",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <User size={20} className="text-gray-500" />
          <span>{value}</span>
        </div>
      ),
    },
    { key: "date" as const, header: "Date" },
    { key: "checkInTime" as const, header: "Check-in Time" },
    { key: "checkOutTime" as const, header: "Check-out Time" },
    { key: "class" as const, header: "Class" },
    {
      key: "notes" as const,
      header: "Notes",
      render: (value: string | undefined) => (
        <span className="text-gray-500">{value || "No notes"}</span>
      ),
    },
  ];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Parent Dashboard" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <button className="btn-primary">Preview Check-in QR Code</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "children"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("children")}
              >
                My Children
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "history"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("history")}
              >
                Check-in History
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "settings"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Account Settings
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === "children" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">My Children</h2>
                    <button className="btn-primary py-1 px-3 text-sm">Add Child</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {childrenData.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start">
                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mr-4">
                              {child.photoUrl ? (
                                <img 
                                  src={child.photoUrl} 
                                  alt={child.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                  <User size={30} className="text-purple-600" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <h3 className="font-bold text-lg">{child.name}</h3>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <Edit size={16} />
                                </button>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">Age {child.age} • {child.class}</p>
                              
                              {child.allergies.length > 0 && (
                                <div className="flex items-center text-sm text-red-600 mb-1">
                                  <AlertTriangle size={16} className="mr-1" />
                                  <span>Allergies: {child.allergies.join(", ")}</span>
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-500 mt-2">{child.notes}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 flex justify-between items-center">
                          <span className="text-sm text-gray-500">Last checked in: Oct 15, 2023</span>
                          <button 
                            className="text-purple-600 text-sm font-medium hover:text-purple-700"
                            onClick={() => setSelectedChild(child)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === "history" && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Check-in History</h2>
                  <DataTable
                    columns={historyColumns}
                    data={checkInHistoryData}
                    keyExtractor={(item) => item.id}
                  />
                </div>
              )}
              
              {activeTab === "settings" && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            className="input-field"
                            defaultValue="Sarah"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            className="input-field"
                            defaultValue="Wilson"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            className="input-field"
                            defaultValue="sarah.wilson@example.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            className="input-field"
                            defaultValue="555-123-4567"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Emergency Contacts</h3>
                      <div className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">James Wilson</h4>
                          <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit size={16} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
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
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Relationship: Spouse</p>
                        <p className="text-sm text-gray-600">Phone: 555-123-4568</p>
                      </div>
                      
                      <button className="btn-secondary text-sm py-1 px-3">
                        <span className="flex items-center">
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
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add Emergency Contact
                        </span>
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Check-in Confirmations</p>
                            <p className="text-sm text-gray-500">Receive notifications when your child is checked in</p>
                          </div>
                          <div className="relative inline-block w-10 align-middle select-none">
                            <input
                              type="checkbox"
                              className="sr-only"
                              defaultChecked={true}
                            />
                            <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform translate-x-4"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Check-out Confirmations</p>
                            <p className="text-sm text-gray-500">Receive notifications when your child is checked out</p>
                          </div>
                          <div className="relative inline-block w-10 align-middle select-none">
                            <input
                              type="checkbox"
                              className="sr-only"
                              defaultChecked={true}
                            />
                            <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform translate-x-4"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Special Announcements</p>
                            <p className="text-sm text-gray-500">Receive notifications about special events and announcements</p>
                          </div>
                          <div className="relative inline-block w-10 align-middle select-none">
                            <input
                              type="checkbox"
                              className="sr-only"
                              defaultChecked={true}
                            />
                            <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform translate-x-4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button className="btn-secondary">Cancel</button>
                      <button className="btn-primary">Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold">Announcements</h2>
              <Bell size={18} className="text-gray-500" />
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {announcementsData.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className={`border-l-4 p-3 rounded-r-lg ${
                      announcement.priority === "high"
                        ? "border-red-500 bg-red-50"
                        : announcement.priority === "medium"
                        ? "border-orange-500 bg-orange-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{announcement.title}</h3>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{announcement.date}</p>
                    <p className="text-sm">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold">Quick Actions</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-purple-100 p-2 mr-3">
                    <Calendar size={18} className="text-purple-600" />
                  </div>
                  <span className="font-medium">View Upcoming Events</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <QrCode size={18} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Generate Check-in QR Code</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-green-100 p-2 mr-3">
                    <Edit size={18} className="text-green-600" />
                  </div>
                  <span className="font-medium">Update Child Information</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
