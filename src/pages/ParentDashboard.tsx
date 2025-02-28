
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Bell, 
  FileText, 
  UserCheck,
  Mail,
  CheckCircle2,
  BadgeAlert,
  MapPin,
  Download
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";

// Mock children data
const childrenData = [
  { 
    id: "1", 
    name: "Emma Wilson", 
    age: 4, 
    class: "Preschool Class",
    attendance: "92%",
    nextClass: "Sunday, 9:30 AM",
    status: "Checked in", 
    checkInTime: "9:30 AM", 
    room: "Room 103",
    teacher: "Sarah Johnson"
  },
  { 
    id: "2", 
    name: "Noah Wilson", 
    age: 2, 
    class: "Toddler Class",
    attendance: "85%",
    nextClass: "Sunday, 9:30 AM",
    status: "Not checked in", 
    checkInTime: "-", 
    room: "Room 101",
    teacher: "Emma Rodriguez"
  },
  { 
    id: "3", 
    name: "Olivia Wilson", 
    age: 6, 
    class: "Elementary Class",
    attendance: "95%",
    nextClass: "Sunday, 11:00 AM",
    status: "Checked out", 
    checkInTime: "11:45 AM", 
    room: "Room 202",
    teacher: "Michael Johnson"
  }
];

// Mock upcoming events
const upcomingEvents = [
  {
    id: "1",
    title: "Summer Bible Camp",
    date: "July 15-19, 2023",
    time: "9:00 AM - 12:00 PM",
    location: "Main Campus",
    description: "A week of fun activities and learning for children ages 3-12."
  },
  {
    id: "2",
    title: "Family Picnic",
    date: "June 12, 2023",
    time: "11:00 AM - 2:00 PM",
    location: "Community Park",
    description: "Join us for food, games, and fellowship with other families."
  },
  {
    id: "3",
    title: "Parent-Teacher Conference",
    date: "May 25, 2023",
    time: "Various Times",
    location: "Children's Building",
    description: "Schedule a meeting with your child's teacher to discuss progress."
  }
];

// Mock notifications
const notifications = [
  {
    id: "1",
    type: "alert",
    title: "New Health Form Required",
    date: "1 day ago",
    read: false,
    message: "Please complete the updated health form for Noah before next Sunday."
  },
  {
    id: "2",
    type: "info",
    title: "Emma's Class Photo Available",
    date: "3 days ago",
    read: true,
    message: "The class photos from last Sunday are now available to download."
  },
  {
    id: "3",
    type: "success",
    title: "Successfully Registered for Summer Camp",
    date: "1 week ago",
    read: true,
    message: "Olivia has been registered for the Summer Bible Camp."
  }
];

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // Children columns for data table
  const childrenColumns = [
    {
      key: "name" as const,
      header: "Child",
      render: (value: string, item: typeof childrenData[0]) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <User size={16} className="text-purple-600" />
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
          <div className="text-xs text-gray-500">{item.room}</div>
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
      key: "teacher" as const,
      header: "Teacher",
      render: (value: string) => (
        <Link to={`/teachers/1`} className="text-purple-600 hover:text-purple-800">
          {value}
        </Link>
      ),
    },
    {
      key: "nextClass" as const,
      header: "Next Class",
      render: (value: string) => (
        <div className="flex items-center">
          <Calendar size={14} className="mr-1 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "attendance" as const,
      header: "Attendance",
      render: (value: string) => (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: value }}></div>
        </div>
      ),
    }
  ];

  // Filter displayed notifications
  const displayedNotifications = showAllNotifications 
    ? notifications 
    : notifications.slice(0, 3);

  return (
    <MainLayout>
      <div className="pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <p className="text-gray-500">Welcome back, James Wilson</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap -mb-px">
            <button
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "overview"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
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
                activeTab === "events"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Events
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "reports"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Children"
                value={childrenData.length}
                description="Registered children"
                icon={<User size={24} />}
                className="bg-white"
              />
              <StatCard
                title="Check-ins Today"
                value="1/3"
                description="Children checked in"
                icon={<UserCheck size={24} />}
                className="bg-white"
              />
              <StatCard
                title="Upcoming Events"
                value={upcomingEvents.length}
                description="Events in next 30 days"
                icon={<Calendar size={24} />}
                className="bg-white"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Children Status</h2>
                <Link to="/children" className="text-sm text-purple-600 hover:text-purple-800">
                  View all
                </Link>
              </div>
              <div className="overflow-hidden">
                <DataTable
                  columns={childrenColumns}
                  data={childrenData}
                  keyExtractor={(item) => item.id}
                  searchable={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Upcoming Events</h2>
                  <Link to="/events" className="text-sm text-purple-600 hover:text-purple-800">
                    View all
                  </Link>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        <span>{event.date}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        <span>{event.time}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    {unreadNotifications > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {unreadNotifications} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAllNotifications(!showAllNotifications)}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    {showAllNotifications ? "Show less" : "View all"}
                  </button>
                </div>
                <div className="space-y-3">
                  {displayedNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${notification.read ? 'bg-white border-gray-200' : 'bg-purple-50 border-purple-200'}`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 p-1 rounded-md ${
                          notification.type === 'alert' ? 'bg-red-100' : 
                          notification.type === 'success' ? 'bg-green-100' : 
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'alert' ? (
                            <AlertCircle size={16} className="text-red-600" />
                          ) : notification.type === 'success' ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                          ) : (
                            <Bell size={16} className="text-blue-600" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-gray-500">{notification.date}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "children" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">My Children</h2>
              <button className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex items-center gap-1">
                <User size={16} />
                <span>Add Child</span>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <DataTable
                columns={childrenColumns}
                data={childrenData}
                keyExtractor={(item) => item.id}
                searchable={true}
                searchPlaceholder="Search children..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {childrenData.map((child) => (
                <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">{child.name}</h3>
                        <p className="text-gray-500">Age {child.age} • {child.class}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Next Class</p>
                        <p className="font-medium">{child.nextClass}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Room</p>
                        <p className="font-medium">{child.room}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Teacher</p>
                        <Link to={`/teachers/1`} className="font-medium text-purple-600 hover:text-purple-800">
                          {child.teacher}
                        </Link>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          child.status === "Checked in" ? "bg-green-100 text-green-800" : 
                          child.status === "Checked out" ? "bg-blue-100 text-blue-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {child.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Attendance</p>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: child.attendance }}></div>
                        </div>
                        <span className="text-sm font-medium">{child.attendance}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 flex justify-between">
                    <Link to={`/children/${child.id}`} className="text-sm font-medium text-purple-600 hover:text-purple-800">
                      View Details
                    </Link>
                    <Link to={`/check-in/${child.id}`} className={`text-sm font-medium ${
                      child.status === "Checked in" ? "text-gray-500 cursor-not-allowed" : "text-purple-600 hover:text-purple-800"
                    }`}>
                      {child.status === "Checked in" ? "Already Checked In" : "Check In"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <div className="flex gap-2">
                <button className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Calendar</span>
                </button>
                <button className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center gap-1">
                  <FileText size={16} />
                  <span>Print Schedule</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-5">
                  <div className="sm:flex justify-between items-start">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <p className="text-gray-600 mt-1">{event.description}</p>
                      
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-1.5" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={16} className="mr-1.5" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin size={16} className="mr-1.5" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700">
                        Register
                      </button>
                      <button className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50">
                        More Info
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Reports & Documents</h2>
              <Link to="/reports" className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex items-center gap-1">
                <FileText size={16} />
                <span>All Reports</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">Last week</span>
                </div>
                <h3 className="font-medium mb-1">Attendance Report</h3>
                <p className="text-sm text-gray-500 mb-4">Weekly attendance summary for all children</p>
                <button className="w-full flex items-center justify-center gap-1.5 text-sm text-purple-600 hover:text-purple-800">
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <Mail size={20} className="text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
                <h3 className="font-medium mb-1">Newsletter</h3>
                <p className="text-sm text-gray-500 mb-4">May 2023 Children's Ministry Newsletter</p>
                <button className="w-full flex items-center justify-center gap-1.5 text-sm text-purple-600 hover:text-purple-800">
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <BadgeAlert size={20} className="text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">1 month ago</span>
                </div>
                <h3 className="font-medium mb-1">Allergy Information</h3>
                <p className="text-sm text-gray-500 mb-4">Important health and allergy information</p>
                <button className="w-full flex items-center justify-center gap-1.5 text-sm text-purple-600 hover:text-purple-800">
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold mb-4">Request Special Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Attendance History</option>
                    <option>Progress Report</option>
                    <option>Payment History</option>
                    <option>Custom Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>All Children</option>
                    <option>Emma Wilson</option>
                    <option>Noah Wilson</option>
                    <option>Olivia Wilson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                    <option>Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                  Request Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
