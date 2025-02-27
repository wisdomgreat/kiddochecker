
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Edit, 
  UserCheck,
  FileText,
  Users,
  Bell
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";

// Mock user data
const userData = {
  id: "1",
  name: "James Wilson",
  email: "james.wilson@example.com",
  phone: "555-456-7890",
  role: "Parent",
  address: "123 Main Street, Anytown, CA 12345",
  joinDate: "Apr 5, 2023",
  lastActive: "Today at 8:20 AM",
  profileImageUrl: null,
  emergencyContact: "Sarah Wilson (Wife) - 555-123-4567",
  status: "Active",
  notes: "Prefers email communication. Volunteers for Sunday activities."
};

// Mock children data
const childrenData = [
  { 
    id: "1", 
    name: "Emma Wilson", 
    age: 4, 
    class: "Preschool Class",
    classroom: "Room 103",
    allergies: "None",
    status: "Checked in", 
    checkInTime: "9:30 AM", 
    teacher: "Sarah Johnson"
  },
  { 
    id: "2", 
    name: "Noah Wilson", 
    age: 2, 
    class: "Toddler Class",
    classroom: "Room 101",
    allergies: "Peanuts - Severe",
    status: "Checked out", 
    checkInTime: "9:45 AM", 
    teacher: "Emma Rodriguez"
  }
];

// Mock activity data
const activityData = [
  { id: "1", action: "Checked in Emma", date: "Today at 9:30 AM", type: "check-in" },
  { id: "2", action: "Updated profile information", date: "Yesterday at 4:15 PM", type: "update" },
  { id: "3", action: "Added new child Noah", date: "5 days ago", type: "add" },
  { id: "4", action: "Changed emergency contact", date: "2 weeks ago", type: "update" },
  { id: "5", action: "Checked in Emma", date: "Last Sunday at 9:35 AM", type: "check-in" },
  { id: "6", action: "Checked in Noah", date: "Last Sunday at 9:35 AM", type: "check-in" },
];

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Children columns for data table
  const childrenColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: typeof childrenData[0]) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">Age {item.age}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "class" as const,
      header: "Class",
      render: (value: string, item: typeof childrenData[0]) => (
        <div>
          <div className="text-sm font-medium">{value}</div>
          <div className="text-xs text-gray-500">{item.classroom}</div>
        </div>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === "Checked in" ? "bg-green-100 text-green-800" : 
          value === "Checked out" ? "bg-blue-100 text-blue-800" : 
          "bg-gray-100 text-gray-800"
        }`}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: "checkInTime" as const,
      header: "Time",
    },
    {
      key: "allergies" as const,
      header: "Allergies",
      render: (value: string) => (
        <span className={`text-sm ${value.includes("Severe") || value.includes("Peanuts") ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "teacher" as const,
      header: "Teacher",
    },
  ];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Users", path: "/users" },
          { label: userData.name },
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="h-24 w-24 bg-purple-100 rounded-full flex items-center justify-center">
              {userData.profileImageUrl ? (
                <img 
                  src={userData.profileImageUrl} 
                  alt={userData.name} 
                  className="h-24 w-24 rounded-full object-cover" 
                />
              ) : (
                <User size={40} className="text-purple-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{userData.name}</h1>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center gap-1 hover:bg-gray-50">
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {userData.role}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                  {userData.status}
                </span>
              </div>
              
              <p className="text-gray-500 text-sm">
                Member since {userData.joinDate} • Last active {userData.lastActive}
              </p>
            </div>
          </div>
          
          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap">
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "profile"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "children"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("children")}
              >
                Children
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "activity"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "settings"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>
          
          {activeTab === "profile" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <Mail size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">{userData.email}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <Phone size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">{userData.phone}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <MapPin size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600">{userData.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Emergency Contact</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-700 mb-1">Emergency Contact</p>
                    <p className="text-orange-600">{userData.emergencyContact}</p>
                  </div>
                  
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mt-6 mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <Calendar size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Member Since</p>
                        <p className="text-gray-600">{userData.joinDate}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <Shield size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Role</p>
                        <p className="text-gray-600">{userData.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Notes</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-600">{userData.notes || "No notes added yet."}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "children" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Children ({childrenData.length})</h3>
                <button className="px-3 py-1.5 rounded-md bg-purple-600 text-white flex items-center gap-1 hover:bg-purple-700">
                  <User size={16} />
                  <span>Add Child</span>
                </button>
              </div>
              
              <DataTable
                columns={childrenColumns}
                data={childrenData}
                keyExtractor={(item) => item.id}
                searchable={true}
                searchPlaceholder="Search children..."
              />
            </div>
          )}
          
          {activeTab === "activity" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Activity History</h3>
              
              <div className="relative border-l-2 border-gray-200 ml-4 pl-6 pb-2">
                {activityData.map((activity, index) => (
                  <div key={activity.id} className="mb-6 relative">
                    <div className="absolute -left-11 mt-1.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.type === "check-in" ? "bg-green-100" : 
                        activity.type === "update" ? "bg-blue-100" : 
                        "bg-purple-100"
                      }`}>
                        {activity.type === "check-in" ? (
                          <UserCheck size={16} className="text-green-600" />
                        ) : activity.type === "update" ? (
                          <Edit size={16} className="text-blue-600" />
                        ) : (
                          <User size={16} className="text-purple-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">{activity.action}</h4>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">User Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Receive text message alerts for check-in/out</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-500">Enable or disable this account</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={userData.status === 'Active'}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Contact Information Visibility</p>
                      <p className="text-sm text-gray-500">Allow teachers to view your contact information</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-red-700 font-medium mb-1">Delete Account</h4>
                  <p className="text-sm text-red-600 mb-3">This action cannot be undone. All data will be permanently deleted.</p>
                  <button className="px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
