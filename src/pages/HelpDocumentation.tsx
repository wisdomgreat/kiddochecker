
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Book,
  Video,
  MessageSquare,
  Search,
  Users,
  Clock,
  Settings,
  Shield,
  Printer,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Phone,
  LayoutDashboard,
  Kanban,
  UserCheck,
  Zap,
  Sparkles
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HelpDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const { isAdmin, isStaff, isTeacher, isParent, isVolunteer, isSuperAdmin, userRole } = useAuth();

  const faqData = [
    {
      category: "getting-started",
      title: "Getting Started",
      icon: Book,
      authorizedRoles: ['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer'],
      questions: [
        {
          question: "How do I check in a child?",
          answer: "At the tablet or kiosk, search for your child's name, select them, and confirm to check in. A security label will print (if enabled) for the child, and a digital or printed QR code will be provided for your pick-up.",
          roles: ['parent', 'volunteer', 'staff', 'teacher']
        },
        {
          question: "How do I check out a child?",
          answer: "Simply scan the QR code you received at check-in at the kiosk. If you lost your code, a staff member can manually check out your child after verifying your identity.",
          roles: ['parent', 'volunteer', 'staff', 'teacher']
        },
        {
          question: "Can my teenager check themselves in?",
          answer: "Yes, if they have 'Youth Kiosk Access' enabled on their profile. They can use their own PIN or name search at the kiosk to check in and out independently.",
          roles: ['parent', 'staff', 'admin']
        }
      ]
    },
    {
      category: "attendance",
      title: "Attendance & Reports",
      icon: Clock,
      authorizedRoles: ['admin', 'super_admin', 'staff', 'teacher'],
      questions: [
        {
          question: "How do I view daily attendance?",
          answer: "Go to the Dashboard and select 'Attendance Management'. You can filter by class, date, or status to see exactly who is on-site.",
          roles: ['staff', 'teacher', 'admin']
        },
        {
          question: "How do I generate attendance reports?",
          answer: "In the Attendance section, set your desired date range and click 'Export Report'. This will download a detailed spreadsheet for your records.",
          roles: ['staff', 'admin']
        }
      ]
    },
    {
      category: "users",
      title: "Organization Management",
      icon: Users,
      authorizedRoles: ['admin', 'super_admin', 'staff'],
      questions: [
        {
          question: "How do I add a new staff member or teacher?",
          answer: "Navigate to the 'Church Management' area or 'Users' page. Click 'Add User', fill in their details, and assign their specific role (Teacher, Staff, etc.).",
          roles: ['admin', 'staff']
        },
        {
          question: "How do I update a user's permissions?",
          answer: "In the Users list, click 'Edit Permissions' on any staff member. You can check specific boxes for what they can access, such as CRM, Messaging, or Financials.",
          roles: ['admin', 'super_admin']
        }
      ]
    },
    {
      category: "security",
      title: "Safety & Security",
      icon: Shield,
      authorizedRoles: ['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer'],
      questions: [
        {
          question: "Who is authorized to pick up my child?",
          answer: "Only the people you list as 'Authorized Pickups' in your family profile can check out your child. Our system cross-references these names at every pick-up.",
          roles: ['parent']
        },
        {
          question: "How do we handle unauthorized pick-up attempts?",
          answer: "If an unauthorized person tries to pick up a child, do not release the child. Alert a staff member immediately and contact the parent for confirmation.",
          roles: ['volunteer', 'staff', 'teacher']
        },
        {
          question: "How is my data protected?",
          answer: "We use banking-level encryption and strict access controls. Only authorized staff members with specific permissions can view sensitive family data.",
          roles: ['parent', 'volunteer']
        }
      ]
    },
    {
      category: "technical",
      title: "Advanced System Settings",
      icon: Settings,
      authorizedRoles: ['admin', 'super_admin'],
      questions: [
        {
          question: "The QR printer is not working.",
          answer: "Check the local printer service connection in 'Settings > Devices'. Ensure the PrintNode or direct print agent is active and the printer is not out of paper.",
          roles: ['admin']
        },
        {
          question: "How are role permissions enforced?",
          answer: "The platform uses granular RBAC (Role-Based Access Control) enforced at both the UI and database level (RLS), ensuring data isolation between different church perspectives.",
          roles: ['admin']
        }
      ]
    },
    {
      category: "guest-journey",
      title: "Guest Journey & CRM",
      icon: Zap,
      authorizedRoles: ['admin', 'super_admin', 'staff'],
      questions: [
        {
          question: "How do I track a new visitor's progress?",
          answer: "Navigate to 'Church Management' > 'Guest Journey'. Use the Funnel View to see overall retention, and the Stage Tracker to see exactly where each person is (First Visit, Contacted, etc.).",
          roles: ['admin', 'staff']
        },
        {
          question: "How do I log a pastoral note or email?",
          answer: "Open the Guest Journey, click on a member's card to open their CRM profile. From there, you can click 'Log Note' or 'Send Email' to keep a history of every interaction.",
          roles: ['admin', 'staff']
        },
        {
          question: "Can I automate follow-up emails?",
          answer: "Yes! The system tracks visitor status. If a visitor hasn't been contacted in 7 days, they appear in the 'Drop-off Prevention' alert on your dashboard.",
          roles: ['admin']
        }
      ]
    }
  ];

  const quickGuides = [
    {
      title: "Daily Check-In Process",
      icon: CheckCircle,
      roles: ['parent', 'volunteer', 'staff', 'teacher'],
      steps: [
        "Find a check-in kiosk tablet",
        "Search for child by name",
        "Confirm details and allergies",
        "Pick up printed security label",
        "Keep your secure pick-up QR code"
      ]
    },
    {
      title: "Emergency Procedures",
      icon: AlertTriangle,
      roles: ['staff', 'teacher', 'admin', 'volunteer'],
      steps: [
        "Remain calm and assess situation",
        "Call 911 if medical emergency",
        "Notify facility administrator immediately",
        "Contact child's emergency contacts from system dashboard",
        "Document incident in the child's activity log"
      ]
    },
    {
      title: "Staff Opening Checklist",
      icon: Clock,
      roles: ['staff', 'admin'],
      steps: [
        "Verify Kiosk devices are charged and online",
        "Check printer paper levels",
        "Review expected attendance from registrations",
        "Ensure all class teachers are checked in"
      ]
    },
    {
      title: "Visitor Onboarding Flow",
      icon: UserCheck,
      roles: ['admin', 'staff'],
      steps: [
        "Monitor New Arrivals in the 'Guest Journey' tab",
        "Move visitors to 'Initial Contact' after first follow-up",
        "Open the **Dual-Pane CRM profile** to see the full interaction history",
        "Log pastoral observations using the **Rapid Insight Log**",
        "Send an automated **Welcome Email** using one of the pre-built templates",
        "Transition to 'Regular Attendee' once consistency is achieved"
      ]
    }
  ];

  const filteredFAQ = faqData
    .filter(category => category.authorizedRoles.includes(userRole as any))
    .map(category => ({
      ...category,
      questions: category.questions.filter(q => q.roles.includes(userRole as any))
    }))
    .filter(category => 
      category.questions.length > 0 && 
      (category.questions.some(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            Help & Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions and learn how to use the system
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="guides">Quick Guides</TabsTrigger>
            <TabsTrigger value="walkthroughs">Walkthroughs</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Kiosk Check-In
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {isParent 
                      ? "Learn how to easily check your children in and out using the kiosk tablets located at the entrance."
                      : "Instructions for managing the kiosk, printing labels, and helping families with check-in."}
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• {isParent ? "Search child by name" : "Helper mode activations"}</li>
                    <li>• {isParent ? "Keep security QR code" : "Manual override codes"}</li>
                    <li>• {isParent ? "Confirm allergy alerts" : "Printer troubleshooting"}</li>
                  </ul>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Staff Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Administrative tools for adding staff, teachers, and managing organizational roles.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Badge variant="outline">Staff</Badge><span>Full operations</span></div>
                      <div className="flex items-center gap-2"><Badge variant="outline">Teacher</Badge><span>Class rosters</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Strict measures to ensure the protection and privacy of every child.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Always verify pickup authorization</li>
                    <li>• {isParent ? "Update your authorized list regularly" : "Check photo ID for new faces"}</li>
                    <li>• Report any security concerns to {isParent ? "staff" : "the director"}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Support Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Who to call if you have questions or an emergency.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div><strong>Emergency:</strong> 911</div>
                    {isAdmin || isStaff ? (
                      <div><strong>Technical Support:</strong> (555) 123-4568</div>
                    ) : (
                      <div><strong>Main Office:</strong> (555) 123-4569</div>
                    )}
                    <div><strong>Ministry Director:</strong> (555) 123-4567</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickGuides
                .filter(guide => guide.roles.includes(userRole as any))
                .map((guide, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <guide.icon className="h-5 w-5 text-blue-600" />
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm flex items-start gap-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isAdmin && (
              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Admin Training Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border bg-white rounded-lg shadow-sm">
                      <h4 className="font-semibold mb-1">Permission Architectures</h4>
                      <p className="text-xs text-muted-foreground mb-3">Understanding role-based access levels.</p>
                      <Button variant="outline" size="sm" className="w-full">Watch Lesson</Button>
                    </div>
                    <div className="p-4 border bg-white rounded-lg shadow-sm">
                      <h4 className="font-semibold mb-1">CRM Automation</h4>
                      <p className="text-xs text-muted-foreground mb-3">Setting up visitor journey triggers.</p>
                      <Button variant="outline" size="sm" className="w-full">Watch Lesson</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="walkthroughs" className="space-y-12">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" /> Visual Interface Guide
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Learn the new Dashboard</h2>
            </div>

            <div className="space-y-20">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl">1</div>
                     <h3 className="text-2xl font-black text-slate-900">Guest Journey Analytics</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">
                        The journey dashboard provides a bird's eye view of your community's growth. 
                        Track **Retention Velocity** to see how fast visitors become members and monitor **Automation Health** to ensure no one falls through the cracks.
                     </p>
                     <div className="flex gap-4">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1">Funnel View</Badge>
                        <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1">Real-time Activity</Badge>
                     </div>
                  </div>
                  <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-white p-2">
                     <img src="/docs/images/guest_journey_dashboard.png" className="rounded-[2rem] w-full h-auto" alt="Dashboard Walkthrough" />
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-white p-2">
                     <img src="/docs/images/visitor_stage_tracker.png" className="rounded-[2rem] w-full h-auto" alt="Kanban Tracker" />
                  </div>
                  <div className="order-1 lg:order-2 space-y-6">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl">2</div>
                     <h3 className="text-2xl font-black text-slate-900">The Stage Tracker</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">
                        Visualize your newcomers as they move through onboarding stages. 
                        Each card represents a soul being cared for. Click any card to open the **Admin CRM** for detailed management.
                     </p>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                           <Kanban className="h-4 w-4 text-indigo-500" /> Multi-column Workflow
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                           <Users className="h-4 w-4 text-indigo-500" /> Demographic insights at a glance
                        </li>
                     </ul>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pb-12">
                  <div className="space-y-6">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl">3</div>
                     <h3 className="text-2xl font-black text-slate-900">Full CRM Profiles</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">
                        Log pastoral notes, send automated follow-up emails, and track every interaction. 
                        The **Interaction Timeline** ensures that every touchpoint is recorded for consistent care.
                     </p>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600">Pro Tip</h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                           Use the "Send Email" action to use pre-built templates for Welcome messages and missing notifications.
                        </p>
                     </div>
                  </div>
                  <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-white p-2">
                     <img src="/docs/images/crm_profile_interaction.png" className="rounded-[2rem] w-full h-auto" alt="CRM Overview" />
                  </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <div className="space-y-4">
              {filteredFAQ.map((category) => (
                <Card key={category.category} className="overflow-hidden border-none shadow-sm bg-gray-50/50">
                  <div className="p-4 bg-white border-b flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <category.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg">{category.title}</h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {category.questions.map((qa, index) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 transition-colors group">
                            <span className="font-medium text-gray-800 group-data-[state=open]:text-blue-600 transition-colors">
                              {qa.question}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4 pt-1">
                            <div className="p-4 bg-white rounded-xl border border-blue-50 text-gray-600 leading-relaxed shadow-inner">
                              {qa.answer}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredFAQ.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No help articles found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
                <p className="text-blue-100">Our team is available to help you {isParent ? "during service hours" : "24/7 via private support lines"}.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isParent ? "Message Office" : "Open System Ticket"}
                </Button>
                {isAdmin && (
                  <Button variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
                    <Settings className="h-4 w-4 mr-2" />
                    Technical Docs
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default HelpDocumentation;
