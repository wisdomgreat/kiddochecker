
import { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Download,
  Plus,
  MoreVertical,
  User,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  Edit,
  Trash2
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";

// Mock data for users
const usersData = [
  { 
    id: "1", 
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "555-123-4567",
    role: "Admin",
    status: "Active",
    lastActive: "Today at 10:45 AM",
    joinDate: "Jan 15, 2023",
    children: 2
  },
  { 
    id: "2", 
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "555-234-5678",
    role: "Teacher",
    status: "Active",
    lastActive: "Today at 9:30 AM",
    joinDate: "Feb 3, 2023",
    children: 0
  },
  { 
    id: "3", 
    name: "Emma Rodriguez",
    email: "emma.rodriguez@example.com",
    phone: "555-345-6789",
    role: "Teacher",
    status: "Active",
    lastActive: "Yesterday at 3:15 PM",
    joinDate: "Mar 12, 2023",
    children: 0
  },
  { 
    id: "4", 
    name: "James Wilson",
    email: "james.wilson@example.com",
    phone: "555-456-7890",
    role: "Parent",
    status: "Active",
    lastActive: "Today at 8:20 AM",
    joinDate: "Apr 5, 2023",
    children: 2
  },
  { 
    id: "5", 
    name: "Jennifer Adams",
    email: "jennifer.adams@example.com",
    phone: "555-567-8901",
    role: "Teacher",
    status: "Inactive",
    lastActive: "2 weeks ago",
    joinDate: "May 22, 2023",
    children: 1
  },
  { 
    id: "6", 
    name: "Robert Davis",
    email: "robert.davis@example.com",
    phone: "555-678-9012",
    role: "Parent",
    status: "Active",
    lastActive: "Yesterday at 5:45 PM",
    joinDate: "Jun 14, 2023",
    children: 1
  },
  { 
    id: "7", 
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    phone: "555-789-0123",
    role: "Parent",
    status: "Active",
    lastActive: "3 days ago",
    joinDate: "Jul 30, 2023",
    children: 3
  },
  { 
    id: "8", 
    name: "David Thompson",
    email: "david.thompson@example.com",
    phone: "555-890-1234",
    role: "Admin",
    status: "Active",
    lastActive: "Today at 11:10 AM",
    joinDate: "Aug 9, 2023",
    children: 0
  },
  { 
    id: "9", 
    name: "Jessica Wong",
    email: "jessica.wong@example.com",
    phone: "555-901-2345",
    role: "Teacher",
    status: "Active",
    lastActive: "Today at 10:30 AM",
    joinDate: "Sep 17, 2023",
    children: 0
  },
  { 
    id: "10", 
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@example.com",
    phone: "555-012-3456",
    role: "Parent",
    status: "Pending",
    lastActive: "Never",
    joinDate: "Oct 25, 2023",
    children: 2
  }
];

// Mock data for children
const childrenData = [
  { id: "1", name: "Emma Wilson", age: 4, class: "Preschool Class" },
  { id: "2", name: "Noah Wilson", age: 2, class: "Toddler Class" }
];

// Mock data for activity
const activityData = [
  { id: "1", action: "Checked in Emma", date: "Today at 9:30 AM", type: "check-in" },
  { id: "2", action: "Updated profile information", date: "Yesterday at 4:15 PM", type: "update" },
  { id: "3", action: "Added new child Noah", date: "5 days ago", type: "add" },
  { id: "4", action: "Changed emergency contact", date: "2 weeks ago", type: "update" },
];

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState<typeof usersData[0] | null>(null);
  const [userDetailTab, setUserDetailTab] = useState("profile");
  
  // User columns for data table
  const userColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: typeof usersData[0]) => (
        <div className="flex items-center">
          <div className="rounded-full bg-gray-100 p-2 mr-3">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role" as const,
      header: "Role",
      render: (value: string) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === "Admin" ? "bg-purple-100 text-purple-800" : 
            value === "Teacher" ? "bg-blue-100 text-blue-800" : 
            value === "Parent" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {value}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === "Active" ? "bg-green-100 text-green-800" : 
            value === "Inactive" ? "bg-gray-100 text-gray-800" : 
            "bg-yellow-100 text-yellow-800"
          }`}>
            {value}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "lastActive" as const,
      header: "Last Active",
      sortable: true,
    },
    {
      key: "children" as const,
      header: "Children",
      render: (value: number) => (
        <div className="flex items-center">
          {value > 0 ? (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {value} {value === 1 ? 'child' : 'children'}
            </span>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      ),
    },
  ];

  // Filter users based on search term and active tab
  const filteredUsers = usersData.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "admin" && user.role === "Admin") ||
      (activeTab === "teachers" && user.role === "Teacher") ||
      (activeTab === "parents" && user.role === "Parent") ||
      (activeTab === "pending" && user.status === "Pending");
    
    return matchesSearch && matchesTab;
  });
  
  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Users", path: "/users" },
          { label: "Management" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center gap-1 hover:bg-gray-50">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center gap-1 hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button className="px-3 py-2 rounded-md bg-purple-600 text-white flex items-center gap-1 hover:bg-purple-700">
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="TOTAL USERS"
          value={usersData.length.toString()}
          description="Active accounts"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="PARENTS"
          value={usersData.filter(u => u.role === "Parent").length.toString()}
          description="Family accounts"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="TEACHERS"
          value={usersData.filter(u => u.role === "Teacher").length.toString()}
          description="Staff members"
          icon={<UserCheck size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="ADMINS"
          value={usersData.filter(u => u.role === "Admin").length.toString()}
          description="System administrators"
          icon={<Shield size={24} />}
          className="bg-white"
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fade-in">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "all"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Users
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "admin"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            Admins
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "teachers"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("teachers")}
          >
            Teachers
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "parents"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("parents")}
          >
            Parents
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "pending"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or role"
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            searchable={false}
            onRowClick={(item) => setSelectedUser(item)}
          />
        </div>
      </div>
      
      {selectedUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fade-in">
          <div className="p-6">
            <div className="flex items-start mb-6">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <User size={32} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedUser.role === "Admin" ? "bg-purple-100 text-purple-800" : 
                        selectedUser.role === "Teacher" ? "bg-blue-100 text-blue-800" : 
                        "bg-green-100 text-green-800"
                      }`}>{selectedUser.role}</span>
                      <span>•</span>
                      <span>Joined {selectedUser.joinDate}</span>
                      <span>•</span>
                      <span>Last active {selectedUser.lastActive}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center gap-1 hover:bg-gray-50">
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button className="px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 flex items-center gap-1 hover:bg-red-100">
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 mb-6">
              <div className="flex">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    userDetailTab === "profile"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setUserDetailTab("profile")}
                >
                  Profile
                </button>
                {selectedUser.role === "Parent" && (
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      userDetailTab === "children"
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setUserDetailTab("children")}
                  >
                    Children
                  </button>
                )}
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    userDetailTab === "activity"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setUserDetailTab("activity")}
                >
                  Activity
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    userDetailTab === "permissions"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setUserDetailTab("permissions")}
                >
                  Permissions
                </button>
              </div>
            </div>
            
            {userDetailTab === "profile" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm uppercase font-semibold text-gray-500 mb-3">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Mail size={18} className="text-gray-400 mr-2" />
                        <span>{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone size={18} className="text-gray-400 mr-2" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase font-semibold text-gray-500 mb-3">Account Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar size={18} className="text-gray-400 mr-2" />
                        <span>Member since {selectedUser.joinDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Shield size={18} className="text-gray-400 mr-2" />
                        <span>Role: {selectedUser.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mb-3">Account Status</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">User Status</p>
                      <p className="text-sm text-gray-500">{selectedUser.status === 'Active' ? 'This account is active and can access the system' : 'This account is currently inactive'}</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={selectedUser.status === 'Active'}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform ${selectedUser.status === 'Active' ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {userDetailTab === "children" && selectedUser.role === "Parent" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Children</h3>
                  <button className="px-2.5 py-1.5 rounded-md bg-purple-600 text-white flex items-center gap-1 hover:bg-purple-700 text-sm">
                    <Plus size={14} />
                    <span>Add Child</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {childrenData.map((child) => (
                    <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{child.name}</h4>
                            <p className="text-sm text-gray-500">Age {child.age} • {child.class}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {userDetailTab === "activity" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                
                <div className="space-y-4">
                  {activityData.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3">
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
                            <UserPlus size={16} className="text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {userDetailTab === "permissions" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Permissions</h3>
                  <p className="text-gray-600 mb-6">Set permissions for this user based on their role in the system.</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium">Administrator Access</p>
                        <p className="text-sm text-gray-500">Full access to all system features and settings</p>
                      </div>
                      <div className="relative inline-block w-14 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          defaultChecked={selectedUser.role === 'Admin'}
                        />
                        <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                        <div className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform ${selectedUser.role === 'Admin' ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium">Teacher Access</p>
                        <p className="text-sm text-gray-500">Access to class management and student records</p>
                      </div>
                      <div className="relative inline-block w-14 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          defaultChecked={selectedUser.role === 'Teacher' || selectedUser.role === 'Admin'}
                        />
                        <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                        <div className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform ${selectedUser.role === 'Teacher' || selectedUser.role === 'Admin' ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium">Parent Access</p>
                        <p className="text-sm text-gray-500">Access to child profiles and check-in/out</p>
                      </div>
                      <div className="relative inline-block w-14 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          defaultChecked={selectedUser.role === 'Parent' || selectedUser.role === 'Admin'}
                        />
                        <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                        <div className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform ${selectedUser.role === 'Parent' || selectedUser.role === 'Admin' ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UsersManagement;
