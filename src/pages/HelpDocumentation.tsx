
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
  Phone
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const HelpDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("getting-started");

  const faqData = [
    {
      category: "getting-started",
      title: "Getting Started",
      icon: Book,
      questions: [
        {
          question: "How do I check in a child?",
          answer: "Use the Check-In Kiosk by searching for the child's name, selecting them, choosing a class (optional), and clicking 'Check In'. A QR code will be generated for check-out."
        },
        {
          question: "How do I check out a child?",
          answer: "Scan the QR code provided during check-in or manually search for the child in the attendance management system and click 'Check Out'."
        },
        {
          question: "What roles are available in the system?",
          answer: "The system has 5 main roles: Parent (manage own children), Staff (full operations), Teacher (class management), Admin (system management), and Volunteer (limited assistance)."
        },
        {
          question: "How do I add a new child?",
          answer: "Navigate to the Children page, click 'Add Child', fill in the required information including emergency contacts and any allergies or medical information."
        }
      ]
    },
    {
      category: "attendance",
      title: "Attendance Management",
      icon: Clock,
      questions: [
        {
          question: "How do I view daily attendance?",
          answer: "Go to Attendance Management to see today's attendance, filter by class or status, and export reports as needed."
        },
        {
          question: "What if a child is marked present but not actually there?",
          answer: "Staff and admin users can modify attendance records. Go to Attendance Management, find the record, and update the status appropriately."
        },
        {
          question: "How do I generate attendance reports?",
          answer: "In Attendance Management, select the date range and filters you want, then click 'Export CSV' to download a detailed report."
        },
        {
          question: "Can parents see their child's attendance history?",
          answer: "Yes, parents can view their own children's attendance history in their dashboard under 'Recent Attendance'."
        }
      ]
    },
    {
      category: "users",
      title: "User Management",
      icon: Users,
      questions: [
        {
          question: "How do I add a new staff member?",
          answer: "Admins can go to Users Management, click 'Add User', enter their information, and assign appropriate roles and permissions."
        },
        {
          question: "How do I change a user's role?",
          answer: "In Users Management, find the user, click the role assignment button, and select the new role. Changes take effect immediately."
        },
        {
          question: "What permissions does each role have?",
          answer: "Parents: manage own children only. Staff: check-in/out, attendance, all children. Teachers: assigned classes, attendance. Admins: full system access."
        },
        {
          question: "How do I reset a user's password?",
          answer: "Currently, users must reset their own passwords using the 'Forgot Password' link on the login page. Admin password reset is coming soon."
        }
      ]
    },
    {
      category: "security",
      title: "Security & Permissions",
      icon: Shield,
      questions: [
        {
          question: "Who can check out a child?",
          answer: "Only authorized individuals listed as emergency contacts can check out a child. Always verify ID and authorization before release."
        },
        {
          question: "What if someone unauthorized tries to pick up a child?",
          answer: "Never release a child to unauthorized individuals. Politely explain the policy and ask them to contact the parent to update authorization."
        },
        {
          question: "How are user permissions managed?",
          answer: "Permissions are role-based. Each role has specific capabilities built-in. Row-level security ensures users only see data they're authorized to access."
        },
        {
          question: "What data can parents see?",
          answer: "Parents can only see information about their own children, including attendance, messages, and basic class information."
        }
      ]
    },
    {
      category: "technical",
      title: "Technical Support",
      icon: Settings,
      questions: [
        {
          question: "The QR code isn't scanning properly. What should I do?",
          answer: "Ensure the QR code is clean and well-lit. Try holding the scanner at different angles. If problems persist, use manual check-out in Attendance Management."
        },
        {
          question: "I can't print name tags. How do I fix this?",
          answer: "Check that your printer is connected and has paper. Ensure your browser allows pop-ups for this site. Contact IT support if issues persist."
        },
        {
          question: "The system is running slowly. What can I do?",
          answer: "Try refreshing the page or clearing your browser cache. Close unnecessary browser tabs. If problems persist, contact technical support."
        },
        {
          question: "I'm getting permission errors. What's wrong?",
          answer: "This usually means your role doesn't have access to that feature. Contact your administrator to verify your role and permissions are correct."
        }
      ]
    }
  ];

  const quickGuides = [
    {
      title: "Daily Check-In Process",
      icon: CheckCircle,
      steps: [
        "Open Check-In Kiosk",
        "Search for child by name",
        "Select child from results",
        "Choose class (if applicable)",
        "Click 'Check In'",
        "Print QR code for parent"
      ]
    },
    {
      title: "Emergency Procedures",
      icon: AlertTriangle,
      steps: [
        "Remain calm and assess situation",
        "Call 911 if medical emergency",
        "Notify facility administrator immediately",
        "Contact child's emergency contacts",
        "Document incident thoroughly",
        "Follow up as required"
      ]
    },
    {
      title: "End of Day Checklist",
      icon: Clock,
      steps: [
        "Check all children are picked up",
        "Review attendance records",
        "Clean and sanitize check-in area",
        "Secure all equipment",
        "Log any incidents or notes",
        "Prepare for next day"
      ]
    }
  ];

  const filteredFAQ = faqData.filter(category =>
    category.questions.some(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="guides">Quick Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Check-In System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Learn how to check children in and out of the facility using our QR code system.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Search and select children</li>
                    <li>• Assign to classes</li>
                    <li>• Generate QR codes</li>
                    <li>• Print name tags</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Roles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Understand the different user roles and their capabilities.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Parent</Badge>
                      <span>Manage own children</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Staff</Badge>
                      <span>Full operations access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Admin</Badge>
                      <span>System management</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Important security measures to keep children safe.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Always verify pickup authorization</li>
                    <li>• Check photo ID when required</li>
                    <li>• Never release children to unauthorized persons</li>
                    <li>• Report suspicious activity immediately</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Important phone numbers for emergencies and support.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div><strong>Emergency:</strong> 911</div>
                    <div><strong>Facility Director:</strong> (555) 123-4567</div>
                    <div><strong>Technical Support:</strong> (555) 123-4568</div>
                    <div><strong>Main Office:</strong> (555) 123-4569</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickGuides.map((guide, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <guide.icon className="h-5 w-5" />
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Daily Check-In Process</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Watch a complete walkthrough of the check-in process.
                    </p>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Video
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">User Management</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn how to add and manage user accounts and roles.
                    </p>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Video
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <div className="space-y-4">
              {(searchTerm ? filteredFAQ : faqData).map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.questions
                        .filter(q =>
                          !searchTerm ||
                          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((qa, index) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="font-medium">{qa.question}</span>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-3 border border-t-0 rounded-b-lg">
                            <p className="text-muted-foreground">{qa.answer}</p>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Get in touch with our support team.
            </p>
            <div className="flex gap-4">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call: (555) 123-4568
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default HelpDocumentation;
