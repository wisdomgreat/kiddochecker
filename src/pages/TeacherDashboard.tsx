
import { useState } from "react";
import { User, Users, AlertTriangle, MessageCircle, CheckCircle, Edit, Calendar, Info } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";

interface Student {
  id: string;
  name: string;
  age: number;
  status: "checked-in" | "checked-out" | "absent";
  checkInTime?: string;
  checkOutTime?: string;
  allergies: string[];
  notes: string;
  photoUrl?: string;
}

// Mock data for students in the class
const studentsData: Student[] = [
  {
    id: "1",
    name: "Emma Wilson",
    age: 4,
    status: "checked-in",
    checkInTime: "9:30 AM",
    allergies: ["Peanuts"],
    notes: "Shy at first, but warms up quickly.",
    photoUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "2",
    name: "Noah Johnson",
    age: 5,
    status: "checked-in",
    checkInTime: "9:28 AM",
    allergies: ["Gluten"],
    notes: "Loves to participate and ask questions.",
    photoUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "3",
    name: "Olivia Smith",
    age: 4,
    status: "checked-in",
    checkInTime: "9:45 AM",
    allergies: [],
    notes: "Very creative, loves to draw.",
    photoUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "4",
    name: "Liam Brown",
    age: 5,
    status: "absent",
    allergies: [],
    notes: "Sometimes has difficulty focusing for long periods.",
  },
  {
    id: "5",
    name: "Ava Davis",
    age: 4,
    status: "checked-in",
    checkInTime: "9:35 AM",
    allergies: ["Dairy"],
    notes: "Very social, loves group activities.",
    photoUrl: "https://images.unsplash.com/photo-1532660621034-fb55e2e59762?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
  },
];

const TeacherDashboard = () => {
  const [selectedTab, setSelectedTab] = useState<"roster" | "lessons" | "messages">("roster");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentNote, setStudentNote] = useState("");
  
  const checkedInCount = studentsData.filter(s => s.status === "checked-in").length;
  const checkedOutCount = studentsData.filter(s => s.status === "checked-out").length;
  const absentCount = studentsData.filter(s => s.status === "absent").length;
  const alertsCount = studentsData.filter(s => s.allergies.length > 0).length;
  
  const handleSaveNote = () => {
    console.log("Saving note for student:", selectedStudent?.id, studentNote);
    // In a real app, this would save the note to the database
    setStudentNote("");
    setSelectedStudent(null);
  };
  
  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Teacher Dashboard" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Preschool Class</h1>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Calendar size={18} />
            <span>View Schedule</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <CheckCircle size={18} />
            <span>Take Attendance</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="PRESENT"
          value={checkedInCount}
          description="Students checked in"
          icon={<CheckCircle size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="CHECKED OUT"
          value={checkedOutCount}
          description="Students checked out"
          icon={<Users size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="ABSENT"
          value={absentCount}
          description="Students absent today"
          icon={<User size={24} />}
          actionLabel="View Absences"
        />
        
        <StatCard
          title="ALERTS"
          value={alertsCount}
          description="Special needs/allergies"
          icon={<AlertTriangle size={24} />}
          actionLabel="View Alerts"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  selectedTab === "roster"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedTab("roster")}
              >
                Class Roster
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  selectedTab === "lessons"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedTab("lessons")}
              >
                Lesson Plans
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  selectedTab === "messages"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedTab("messages")}
              >
                Parent Messages
              </button>
            </div>
            
            <div className="p-6">
              {selectedTab === "roster" && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Students in Class Today</h2>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="border border-gray-200 rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                          className="text-gray-400"
                        >
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentsData.map((student) => (
                      <div
                        key={student.id}
                        className={`border rounded-lg overflow-hidden ${
                          student.status === "checked-in"
                            ? "border-green-200"
                            : student.status === "checked-out"
                            ? "border-purple-200"
                            : "border-gray-200 opacity-60"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex">
                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mr-4">
                              {student.photoUrl ? (
                                <img 
                                  src={student.photoUrl} 
                                  alt={student.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                  <User size={30} className="text-purple-600" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-lg">{student.name}</h3>
                                  <p className="text-gray-600 text-sm">Age {student.age}</p>
                                </div>
                                
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  student.status === "checked-in"
                                    ? "bg-green-100 text-green-800"
                                    : student.status === "checked-out"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {student.status === "checked-in"
                                    ? `Checked in at ${student.checkInTime}`
                                    : student.status === "checked-out"
                                    ? `Checked out at ${student.checkOutTime}`
                                    : "Absent today"}
                                </div>
                              </div>
                              
                              {student.allergies.length > 0 && (
                                <div className="mt-2 flex items-center text-sm text-red-600">
                                  <AlertTriangle size={16} className="mr-1" />
                                  <span>Allergies: {student.allergies.join(", ")}</span>
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-500 mt-1">{student.notes}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 flex justify-between border-t border-gray-200">
                          <button 
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            onClick={() => {
                              setSelectedStudent(student);
                              setStudentNote("");
                            }}
                          >
                            Add Note
                          </button>
                          
                          <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                            Send Message to Parent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTab === "lessons" && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Today's Lesson Plan</h2>
                  
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-lg font-bold">Creation Story</h3>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Lesson Objectives</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>Children will learn about God creating the world</li>
                          <li>Children will identify different things God created</li>
                          <li>Children will understand that God created them special</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Materials Needed</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>Creation story book</li>
                          <li>Coloring pages</li>
                          <li>Crayons and markers</li>
                          <li>Construction paper</li>
                          <li>Safety scissors</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Schedule</h4>
                        <div className="space-y-2">
                          <div className="flex">
                            <span className="text-sm font-medium w-24">9:30 - 9:45</span>
                            <span className="text-sm">Welcome and free play</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm font-medium w-24">9:45 - 10:15</span>
                            <span className="text-sm">Circle time and Bible story</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm font-medium w-24">10:15 - 10:45</span>
                            <span className="text-sm">Creation craft activity</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm font-medium w-24">10:45 - 11:00</span>
                            <span className="text-sm">Snack time</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm font-medium w-24">11:00 - 11:30</span>
                            <span className="text-sm">Games and song time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Upcoming Lessons</h3>
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
                        Add Lesson
                      </span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Noah's Ark</h4>
                        <span className="text-xs text-gray-500">Next Sunday</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Children will learn about Noah's obedience and God's promises.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">David and Goliath</h4>
                        <span className="text-xs text-gray-500">In 2 weeks</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Children will learn about courage and trusting God.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Daniel in the Lion's Den</h4>
                        <span className="text-xs text-gray-500">In 3 weeks</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Children will learn about faith and God's protection.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedTab === "messages" && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Parent Messages</h2>
                  
                  <div className="border border-gray-200 rounded-lg mb-6">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold">New Messages</h3>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">Sarah Wilson (Emma's parent)</div>
                          <div className="text-xs text-gray-500">Today, 8:45 AM</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Emma has been practicing the song from last week. She's very excited about today's class!
                        </p>
                      </div>
                      
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">Michael Johnson (Noah's parent)</div>
                          <div className="text-xs text-gray-500">Yesterday, 7:30 PM</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Noah might be a little tired today. He didn't sleep well last night.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200 flex justify-between">
                      <h3 className="font-bold">Send Announcements</h3>
                      <div className="text-sm text-gray-500">
                        15 recipients
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-4">
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <input
                          id="subject"
                          type="text"
                          placeholder="Enter announcement subject"
                          className="input-field"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          rows={4}
                          placeholder="Enter your message to parents"
                          className="input-field"
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <button className="btn-secondary">Save Draft</button>
                        <button className="btn-primary">Send to All Parents</button>
                      </div>
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
              <h2 className="font-bold">Helpful Resources</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium mb-1">Age-Appropriate Activities</h3>
                  <p className="text-sm text-gray-500">Guide for preschool activities and games</p>
                </a>
                
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium mb-1">Classroom Management Tips</h3>
                  <p className="text-sm text-gray-500">Strategies for managing a preschool classroom</p>
                </a>
                
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium mb-1">Lesson Plan Templates</h3>
                  <p className="text-sm text-gray-500">Downloadable templates for lesson planning</p>
                </a>
                
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium mb-1">Bible Stories for Kids</h3>
                  <p className="text-sm text-gray-500">Simplified Bible stories for young children</p>
                </a>
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
                  <div className="rounded-full bg-green-100 p-2 mr-3">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <span className="font-medium">Mark Attendance</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-purple-100 p-2 mr-3">
                    <MessageCircle size={18} className="text-purple-600" />
                  </div>
                  <span className="font-medium">Message All Parents</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <AlertTriangle size={18} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Report an Issue</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-orange-100 p-2 mr-3">
                    <Calendar size={18} className="text-orange-600" />
                  </div>
                  <span className="font-medium">Print Today's Materials</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold">Add Note for {selectedStudent.name}</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedStudent(null)}
              >
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
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  id="note"
                  rows={4}
                  placeholder="Enter your note about the student..."
                  className="input-field"
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                ></textarea>
              </div>
              
              <div className="flex items-center mb-4">
                <input
                  id="shareWithParent"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="shareWithParent" className="ml-2 text-sm text-gray-700">
                  Share this note with parents
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedStudent(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveNote}
                  disabled={!studentNote.trim()}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TeacherDashboard;
