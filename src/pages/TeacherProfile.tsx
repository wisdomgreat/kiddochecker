
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Users,
  Clock,
  MapPin,
  Award,
  BookOpen,
  Edit,
  Briefcase,
  Shield,
  UserCheck,
  Download
} from "lucide-react";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";

// Mock teacher data
const teacherData = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "555-123-4567",
  role: "Lead Teacher",
  address: "456 Oak Avenue, Anytown, CA 12345",
  joinDate: "Jan 15, 2022",
  lastActive: "Today at 10:45 AM",
  profileImageUrl: null,
  emergency_contact: "John Johnson (Husband) - 555-876-5432",
  status: "Active",
  bio: "Sarah has been teaching preschool for 5 years and holds a degree in Early Childhood Education. She loves creating engaging learning environments and building relationships with her students.",
  certifications: ["CPR and First Aid", "Early Childhood Education Degree", "Child Development Associate"],
  experience: "5 years",
  schedule: "Sunday 8:30 AM - 12:30 PM"
};

// Mock classes data
const classesData = [
  { 
    id: "1", 
    name: "Preschool Class", 
    ageGroup: "Ages 3-5", 
    schedule: "Sunday, 9:30 AM - 11:30 AM",
    location: "Room 103",
    studentCount: 15
  }
];

// Mock students data
const studentsData = [
  { id: "1", name: "Emma Wilson", age: 4, status: "Checked in", allergies: "None", parentName: "James Wilson" },
  { id: "2", name: "Noah Johnson", age: 5, status: "Checked in", allergies: "Peanuts", parentName: "Michael Johnson" },
  { id: "3", name: "Olivia Smith", age: 3, status: "Checked in", allergies: "None", parentName: "Emily Smith" },
  { id: "4", name: "Liam Brown", age: 4, status: "Checked in", allergies: "Special needs: Yes", parentName: "Jessica Brown" },
  { id: "5", name: "Ava Davis", age: 5, status: "Checked out", allergies: "Gluten", parentName: "Robert Davis" },
  { id: "6", name: "Isabella Garcia", age: 4, status: "Checked in", allergies: "None", parentName: "Maria Garcia" },
  { id: "7", name: "Mason Rodriguez", age: 5, status: "Checked in", allergies: "Dairy", parentName: "Carlos Rodriguez" }
];

// Mock lessons/activities data
const lessonsData = [
  { 
    id: "1", 
    title: "Creation Story", 
    date: "Next Sunday", 
    status: "Upcoming",
    description: "Lesson about the 7 days of creation with interactive activities.",
    materials: "Craft supplies, picture books, coloring sheets"
  },
  { 
    id: "2", 
    title: "Noah's Ark", 
    date: "Last Sunday", 
    status: "Completed",
    description: "Lesson about Noah's Ark with animal matching games.",
    materials: "Animal figures, picture books, rainbow craft"
  }
];

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Students columns for data table
  const studentsColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: typeof studentsData[0]) => (
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
      key: "allergies" as const,
      header: "Allergies",
      render: (value: string) => (
        <span className={`text-sm ${value.includes("Special needs") || value.includes("Peanuts") ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "parentName" as const,
      header: "Parent/Guardian",
    },
  ];

  return (
    <UnifiedDashboardLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Users", path: "/users" },
          { label: "Teachers", path: "/users?role=teacher" },
          { label: teacherData.name },
        ]}
      />
      
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
              {teacherData.profileImageUrl ? (
                <img 
                  src={teacherData.profileImageUrl} 
                  alt={teacherData.name} 
                  className="h-24 w-24 rounded-full object-cover" 
                />
              ) : (
                <User size={40} className="text-blue-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{teacherData.name}</h1>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button className="px-3 py-1.5 rounded-md bg-card border border-border text-gray-600 flex items-center gap-1 hover:bg-gray-50">
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                  <Link to={`/classes`} className="px-3 py-1.5 rounded-md bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700">
                    <GraduationCap size={16} />
                    <span>View Classes</span>
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {teacherData.role}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {teacherData.status}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  {teacherData.experience} Experience
                </span>
              </div>
              
              <p className="text-gray-500 text-sm">
                Teacher since {teacherData.joinDate} • Last active {teacherData.lastActive}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="ASSIGNED CLASSES"
              value={classesData.length.toString()}
              description="Current classes"
              icon={<GraduationCap size={24} />}
              className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
            />
            
            <StatCard
              title="STUDENTS"
              value={studentsData.length.toString()}
              description="Across all classes"
              icon={<Users size={24} />}
              className="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
            />
            
            <StatCard
              title="SCHEDULE"
              value="Sunday"
              description={teacherData.schedule.split(" ").slice(1).join(" ")}
              icon={<Clock size={24} />}
              className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
            />
          </div>
          
          <div className="border-b border-border mb-6">
            <div className="flex flex-wrap">
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "classes"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("classes")}
              >
                Classes
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "students"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("students")}
              >
                Students
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "lessons"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("lessons")}
              >
                Lessons
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "settings"
                    ? "text-blue-600 border-b-2 border-blue-600"
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
              <div>
                <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">About</h3>
                <p className="text-gray-700">{teacherData.bio}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <Mail size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">{teacherData.email}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <Phone size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">{teacherData.phone}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <MapPin size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600">{teacherData.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Emergency Contact</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-700 mb-1">Emergency Contact</p>
                    <p className="text-orange-600">{teacherData.emergency_contact}</p>
                  </div>
                  
                  <h3 className="text-sm uppercase font-semibold text-gray-500 mt-6 mb-4">Teaching Schedule</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <Calendar size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Regular Schedule</p>
                        <p className="text-gray-600">{teacherData.schedule}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <Briefcase size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Experience</p>
                        <p className="text-gray-600">{teacherData.experience}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">Certifications & Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {teacherData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                      <Award size={16} className="mr-1.5" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "classes" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Assigned Classes</h3>
                <button className="px-3 py-1.5 rounded-md bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700">
                  <GraduationCap size={16} />
                  <span>Assign New Class</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {classesData.map((classItem) => (
                  <div key={classItem.id} className="border border-border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <GraduationCap size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{classItem.name}</h4>
                          <p className="text-sm text-gray-500">{classItem.ageGroup} • {classItem.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {classItem.studentCount} students
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-gray-100 pt-2 flex justify-between">
                      <div className="text-sm text-gray-500">
                        <Calendar size={14} className="inline mr-1" /> {classItem.schedule}
                      </div>
                      <Link to={`/classes`} className="text-blue-600 text-sm hover:text-blue-800">
                        View Class Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "students" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Students ({studentsData.length})</h3>
                <button className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 hover:bg-blue-100">
                  <Download size={16} />
                  <span>Export Roster</span>
                </button>
              </div>
              
              <DataTable
                columns={studentsColumns}
                data={studentsData}
                keyExtractor={(item) => item.id}
                searchable={true}
                searchPlaceholder="Search students..."
              />
            </div>
          )}
          
          {activeTab === "lessons" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Lessons & Activities</h3>
                <button className="px-3 py-1.5 rounded-md bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700">
                  <FileText size={16} />
                  <span>Add New Lesson</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {lessonsData.map((lesson) => (
                  <div key={lesson.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <BookOpen size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-gray-500">{lesson.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lesson.status === "Upcoming" ? "bg-blue-100 text-blue-800" : 
                          lesson.status === "Completed" ? "bg-green-100 text-green-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {lesson.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{lesson.description}</p>
                    </div>
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <p className="text-sm">
                        <span className="font-medium">Materials:</span> {lesson.materials}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Teacher Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email notifications for class updates</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-card shadow transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Receive text message alerts for important notices</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-card shadow transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Teacher Status</p>
                      <p className="text-sm text-gray-500">Set your current status in the system</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={teacherData.status === 'Active'}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-card shadow transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Class Management</p>
                      <p className="text-sm text-gray-500">Ability to edit class details and manage students</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-card shadow transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Attendance Records</p>
                      <p className="text-sm text-gray-500">Ability to mark attendance and view history</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={true}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-card shadow transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-border pt-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-red-700 font-medium mb-1">Deactivate Account</h4>
                  <p className="text-sm text-red-600 mb-3">Temporarily deactivate your account. You can reactivate at any time.</p>
                  <button className="px-3 py-1.5 bg-card border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default TeacherProfile;

