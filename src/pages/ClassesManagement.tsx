
import { useState } from "react";
import { GraduationCap, Search, Edit, MoreVertical, Users, Calendar, Bell } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";

// Mock data for classes
const classesData = [
  { 
    id: "1", 
    name: "Preschool Class", 
    ageGroup: "Ages 3-5", 
    capacity: "15/20 capacity", 
    status: true 
  },
  { 
    id: "2", 
    name: "Toddler Class", 
    ageGroup: "Ages 1-2", 
    capacity: "8/12 capacity", 
    status: true 
  },
  { 
    id: "3", 
    name: "Elementary Class", 
    ageGroup: "Ages 6-10", 
    capacity: "15/25 capacity", 
    status: true 
  },
  { 
    id: "4", 
    name: "Middle School Class", 
    ageGroup: "Ages 11-13", 
    capacity: "12/20 capacity", 
    status: true 
  },
  { 
    id: "5", 
    name: "High School Class", 
    ageGroup: "Ages 14-18", 
    capacity: "10/15 capacity", 
    status: true 
  }
];

// Mock data for class roster
const rosterData = [
  { id: "1", name: "Emma Wilson", age: 4, status: "Checked in", time: "9:45 AM", allergies: "None" },
  { id: "2", name: "Noah Johnson", age: 5, status: "Checked in", time: "9:48 AM", allergies: "Peanuts" },
  { id: "3", name: "Olivia Smith", age: 3, status: "Checked in", time: "9:50 AM", allergies: "None" },
  { id: "4", name: "Liam Brown", age: 4, status: "Checked in", time: "9:55 AM", allergies: "Special needs: Yes" }
];

const ClassesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedClass, setSelectedClass] = useState(classesData[0]);
  
  // Filter classes based on search term
  const filteredClasses = classesData.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.ageGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Classes", path: "/classes" },
          { label: "Management" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes Management</h1>
        <button className="btn-primary">Add New Class</button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fade-in">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "active"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Classes
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "archived"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("archived")}
          >
            Archived Classes
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "templates"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("templates")}
          >
            Class Templates
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Active Classes</h2>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, age group, or teacher"
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age Group
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teachers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((classItem) => (
                  <tr 
                    key={classItem.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedClass(classItem)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="rounded-full bg-purple-100 p-2 mr-3">
                          <GraduationCap size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                          <div className="text-sm text-gray-500">{classItem.ageGroup}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.ageGroup}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Status
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          defaultChecked={classItem.status}
                        />
                        <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform ${classItem.status ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600 mr-3">
                        <Edit size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fade-in">
          <div className="p-6">
            <div className="flex items-start mb-6">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <GraduationCap size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedClass.name}</h2>
                <p className="text-gray-600">
                  A nurturing environment for young children to learn biblical stories through interactive activities.
                </p>
                <div className="mt-4 space-x-3">
                  <button className="btn-primary">Edit Class</button>
                  <button className="btn-secondary">View Roster</button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="STUDENTS"
                value="12"
                description="Currently checked in"
                icon={<Users size={24} />}
                actionLabel="View Students"
              />
              
              <StatCard
                title="TEACHERS"
                value="2"
                description="Assigned to class"
                icon={<Users size={24} />}
                actionLabel="Manage Teachers"
              />
              
              <StatCard
                title="SCHEDULE"
                value="Sunday"
                description="9:30 AM - 11:30 AM"
                icon={<Calendar size={24} />}
                actionLabel="Edit Schedule"
              />
              
              <StatCard
                title="ALERTS"
                value="1"
                description="Special needs student"
                icon={<Bell size={24} />}
                actionLabel="View Details"
              />
            </div>
            
            <h3 className="text-xl font-bold mb-4">Class Roster</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allergies
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rosterData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users size={16} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Age {student.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.allergies}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4">
              <button className="btn-primary">View Full Roster</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ClassesManagement;
