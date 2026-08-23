import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  HelpCircle,
  Book,
  Search,
  Users,
  Clock,
  Settings,
  Shield,
  Printer,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Monitor,
  HeartPulse,
  ShieldCheck,
  Baby,
  Trophy,
  Mail,
  Smartphone,
  Cpu,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  ExternalLink,
  LifeBuoy,
  Check,
  UserCheck,
  FileCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Step-By-Step Interactive Guide Data ─────────────────────────────────────
interface StepGuide {
  id: string;
  title: string;
  targetRole: "parent" | "staff" | "volunteer" | "admin" | "all";
  roleBadge: string;
  roleBadgeColor: string;
  category: string;
  icon: any;
  summary: string;
  estimatedTime: string;
  steps: {
    number: number;
    title: string;
    description: string;
    tip?: string;
  }[];
  actionLink?: {
    text: string;
    url: string;
  };
}

const STEP_GUIDES: StepGuide[] = [
  // ── PARENT GUIDES ──
  {
    id: "parent-kiosk-checkin",
    title: "How to Check In Your Child at the Kiosk",
    targetRole: "parent",
    roleBadge: "For Parents",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Check-In & Attendance",
    icon: Monitor,
    summary: "Check in your children in under 10 seconds using your phone number, 6-digit PIN, QR code, or NFC tap.",
    estimatedTime: "1 min",
    actionLink: { text: "Open Kiosk Station", url: "/check-in" },
    steps: [
      {
        number: 1,
        title: "Locate Kiosk & Enter Phone Number or Tap NFC",
        description: "On the terminal screen, enter the last 4 digits of your mobile number, type your full phone number, or simply hold your registered phone/key-tag to the NFC reader.",
        tip: "If you received a Fast-Pass PIN in your email, you can select 'Fast-Pass PIN' to skip typing your phone number."
      },
      {
        number: 2,
        title: "Enter Your 6-Digit Security PIN",
        description: "Enter your private 6-digit Security PIN (found on your Profile page) to confirm you are the authorized guardian.",
        tip: "Keep your PIN confidential. It ensures only approved family members can access your family's profile."
      },
      {
        number: 3,
        title: "Select Children & Health Screening",
        description: "Check the checkbox next to each child attending today. Confirm they are symptom-free (no fever or cough in the last 24h).",
      },
      {
        number: 4,
        title: "Collect Printed Name Tag & Claim Ticket",
        description: "The kiosk automatically prints a Child Name Tag (stick to child's clothing) and a matching Parent Claim Ticket with a unique security code.",
        tip: "Do NOT lose your Parent Claim Ticket — staff will match this security code before releasing your child during pick-up!"
      }
    ]
  },
  {
    id: "parent-add-children",
    title: "How to Register Children & Allergy Alerts",
    targetRole: "parent",
    roleBadge: "For Parents",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Family Profile",
    icon: Baby,
    summary: "Add your children to the registry, set emergency contacts, and record vital allergies or medical alerts.",
    estimatedTime: "2 mins",
    actionLink: { text: "Manage My Children", url: "/parent/children" },
    steps: [
      {
        number: 1,
        title: "Navigate to 'My Children'",
        description: "Click on 'My Children' in your sidebar or parent dashboard menu.",
      },
      {
        number: 2,
        title: "Click 'Register Child' & Fill Details",
        description: "Provide the child's full legal name, date of birth, age, and grade level.",
      },
      {
        number: 3,
        title: "Highlight Allergies and Special Needs",
        description: "Enter any food allergies (peanuts, dairy, gluten), medical conditions, or EpiPen instructions. These will be highlighted in bold red on child name tags and teacher rosters.",
        tip: "Always inform the lead classroom teacher of severe allergies during drop-off."
      },
      {
        number: 4,
        title: "Save Profile",
        description: "Click 'Save Child'. Your child will immediately appear on all check-in kiosk terminals across the campus."
      }
    ]
  },
  {
    id: "parent-rewards",
    title: "How Kids Earn Points & Redeem Rewards",
    targetRole: "parent",
    roleBadge: "For Parents",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Gamification",
    icon: Trophy,
    summary: "Encourage consistent attendance and scripture memory with our automated points and prize store.",
    estimatedTime: "1 min",
    actionLink: { text: "View Rewards Store", url: "/parent/rewards" },
    steps: [
      {
        number: 1,
        title: "Automatic Check-In Points",
        description: "Every time your child checks in on time on Sunday or during mid-week service, their account automatically earns attendance reward points.",
      },
      {
        number: 2,
        title: "Track Total Points on the Parent Portal",
        description: "Check your Parent Dashboard or 'Rewards' tab to see point balances and active attendance streaks for each child.",
      },
      {
        number: 3,
        title: "Browse Prize Catalog & Request Redemption",
        description: "Select available prizes from the store. Teachers and ministry leaders will present the gift at the end of class!"
      }
    ]
  },

  // ── STAFF & TEACHER GUIDES ──
  {
    id: "staff-admissions",
    title: "How to Perform Manual Admissions & Health Checks",
    targetRole: "staff",
    roleBadge: "For Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Classroom Management",
    icon: UserCheck,
    summary: "Manually admit children without physical tags, log health screenings, and assign classrooms.",
    estimatedTime: "2 mins",
    actionLink: { text: "Open Attendance Ledger", url: "/attendance" },
    steps: [
      {
        number: 1,
        title: "Open the Attendance Page or Kiosk Override",
        description: "From the staff sidebar, click 'Attendance'. You will see the real-time headcount and active student list.",
      },
      {
        number: 2,
        title: "Click 'Manual Check-In'",
        description: "Click the '+ Manual Check-In' button. Search for the child in the registered roster.",
        tip: "Children who are already checked in today will be disabled with '(Already Present Today)' to prevent accidental duplicate entries."
      },
      {
        number: 3,
        title: "Assign Learning Environment & Room",
        description: "Select the assigned classroom (e.g. Toddlers, Kindergarten, Elementary, Purity) and confirm health screening checklist.",
      },
      {
        number: 4,
        title: "Authorize Check-In",
        description: "Click 'Check In'. The action is stamped into the Master Liability Audit Trail with your staff credentials."
      }
    ]
  },
  {
    id: "staff-duty-of-care",
    title: "How to Log Duty of Care Events (Feeding, Diapers, Incidents)",
    targetRole: "staff",
    roleBadge: "For Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Duty of Care",
    icon: HeartPulse,
    summary: "Record diaper changes, bottle feedings, medication administrations, and minor incidents in real time.",
    estimatedTime: "1 min",
    actionLink: { text: "Go to Attendance", url: "/attendance" },
    steps: [
      {
        number: 1,
        title: "Find the Child on the Active Roster",
        description: "On the Attendance page, locate the child in the currently present table.",
      },
      {
        number: 2,
        title: "Open the 'Care Log' Menu",
        description: "Click the 3-dots action menu on the child's row and select 'Log Care Event'.",
      },
      {
        number: 3,
        title: "Select Event Type & Add Notes",
        description: "Choose Diaper Change, Bottle / Snack, Medication Administered, Nap Time, or Incident. Enter relevant observations.",
      },
      {
        number: 4,
        title: "Submit Log",
        description: "The note is permanently stored in the audit log and instantly viewable by parents and administrative supervisors."
      }
    ]
  },
  {
    id: "staff-checkout",
    title: "How to Execute Secure Check-Out & Guardian Verification",
    targetRole: "staff",
    roleBadge: "For Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Child Safety",
    icon: ShieldCheck,
    summary: "Match the Parent Claim Ticket security code or capture a digital signature before dismissing any child.",
    estimatedTime: "1 min",
    actionLink: { text: "Open Check-Out Station", url: "/check-out" },
    steps: [
      {
        number: 1,
        title: "Scan Parent Claim Ticket or Search Name",
        description: "At the dismissal desk, scan the QR code on the parent's claim ticket or search the child's name in the Check-Out Station.",
      },
      {
        number: 2,
        title: "Verify Security Match & Guardian ID",
        description: "Confirm that the 4-character security code on the child's name tag matches the parent's ticket and that the photo matches the guardian profile.",
      },
      {
        number: 3,
        title: "Staff Override (If Ticket is Missing)",
        description: "If a parent lost their physical ticket, ask for government photo ID, verify their name in the family directory, and enter an admin override reason.",
        tip: "All manual overrides require entering an explicit reason which is logged in the permanent forensic liability ledger."
      },
      {
        number: 4,
        title: "Confirm Release",
        description: "Click 'Complete Check-Out'. The child is safely checked out and the real-time headcount updates immediately."
      }
    ]
  },

  // ── VOLUNTEER GUIDES ──
  {
    id: "volunteer-kiosk-assistance",
    title: "How to Assist First-Time Guests & Families",
    targetRole: "volunteer",
    roleBadge: "For Volunteers",
    roleBadgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    category: "Guest Experience",
    icon: Users,
    summary: "Welcome families at the lobby kiosk, assist with printer tags, and guide children to classrooms.",
    estimatedTime: "2 mins",
    steps: [
      {
        number: 1,
        title: "Greet Families with a Smile",
        description: "Stand beside the kiosk station to welcome parents. Ask if they are registered or visiting for the first time.",
      },
      {
        number: 2,
        title: "Guide Returning Families",
        description: "Instruct parents to enter their phone number or scan their mobile QR pass on the barcode reader.",
      },
      {
        number: 3,
        title: "Assist First-Time Guests",
        description: "Guide new guests to tap 'New Family Registration' on the kiosk. Help them fill in basic contact details and child allergy flags in under 60 seconds.",
      },
      {
        number: 4,
        title: "Ensure Tags are Attached",
        description: "Ensure the printed name tag is placed on the child's back or front shirt and remind the parent to keep their Parent Claim Ticket safe."
      }
    ]
  },

  // ── ADMIN & SUPER ADMIN GUIDES ──
  {
    id: "admin-hardware-printing",
    title: "How to Configure Thermal Printers & Kiosks",
    targetRole: "admin",
    roleBadge: "For Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Hardware & Infrastructure",
    icon: Printer,
    summary: "Set up Brother, Zebra, DYMO, or network thermal label printers with direct IP printing.",
    estimatedTime: "3 mins",
    actionLink: { text: "Device Enrollment", url: "/devices" },
    steps: [
      {
        number: 1,
        title: "Enroll Station in 'Device Enrollment'",
        description: "Navigate to 'Device Enrollment' in the admin sidebar. Click 'Enroll New Device' to generate an authorized hardware token.",
      },
      {
        number: 2,
        title: "Configure Printer Target IP & Model",
        description: "In Kiosk Settings, enter the local IP address of your thermal printer (e.g. 192.168.1.150) or select System Dialog Printing.",
        tip: "Ensure your printer is set to standard continuous or 2.25\" x 3.5\" thermal adhesive labels."
      },
      {
        number: 3,
        title: "Perform a Test Print",
        description: "Click 'Test Print Label'. Confirm that a Child Badge and Parent Claim Ticket print separately with crisp QR codes and bold allergy banners.",
      },
      {
        number: 4,
        title: "Enable Network IP Lockdown",
        description: "Lock the station to your church's physical Wi-Fi IP address range to prevent unauthorized external access."
      }
    ]
  },
  {
    id: "admin-liability-reports",
    title: "How to Generate Master Liability Audit Reports",
    targetRole: "admin",
    roleBadge: "For Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Compliance & Safety",
    icon: FileSpreadsheet,
    summary: "Inspect and export forensic check-in ledgers with timestamped guardian identities, station names, and durations.",
    estimatedTime: "2 mins",
    actionLink: { text: "View Reports & Analytics", url: "/reports" },
    steps: [
      {
        number: 1,
        title: "Open the Enhanced Reports & Analytics Suite",
        description: "Navigate to 'Reports' in the sidebar menu.",
      },
      {
        number: 2,
        title: "Select 'Master Liability Audit Trail' Tab",
        description: "This view presents all 60+ forensic attendance records including child ages, allergy flags, check-in actor name & role, check-out actor name & role, station name, and duration.",
      },
      {
        number: 3,
        title: "Filter by Date Range or Class",
        description: "Select custom dates (e.g. Last 7 Days, Month to Date, or specific Sunday service).",
      },
      {
        number: 4,
        title: "Export to CSV / Excel",
        description: "Click 'Export Audit Trail' to download a clean CSV file for compliance auditing, insurance verification, or pastoral records."
      }
    ]
  },
  {
    id: "admin-email-fastpass",
    title: "How to Broadcast Summer Camp Fast-Pass PINs",
    targetRole: "admin",
    roleBadge: "For Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Communication",
    icon: Mail,
    summary: "Deliver personalized Fast-Pass PINs to all registered church families in a single click with delivery tracking.",
    estimatedTime: "2 mins",
    actionLink: { text: "Email Delivery Logs", url: "/admin/email-logs" },
    steps: [
      {
        number: 1,
        title: "Open Email Delivery Logs",
        description: "Navigate to 'Email Delivery Logs' in the admin configuration menu.",
      },
      {
        number: 2,
        title: "Click 'Broadcast Summer Camp Pass'",
        description: "Click the purple 'Broadcast Summer Camp Pass' button. The Azure Communication Services engine generates unique PINs for every parent.",
      },
      {
        number: 3,
        title: "Monitor Real-Time Email Delivery",
        description: "Inspect the live delivery table to verify that each parent's email status shows 'Delivered' with timestamp and recipient details.",
      },
      {
        number: 4,
        title: "Send Test Email (Optional)",
        description: "Use the 'Send Test Email' button to verify your Azure Communication Services connection string and template formatting at any time."
      }
    ]
  },
  {
    id: "admin-safety-cutoff",
    title: "Understanding the 24-Hour Safety Cutoff & Stale Session Sweep",
    targetRole: "admin",
    roleBadge: "For Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "System Safeguards",
    icon: Shield,
    summary: "How our autonomous background engine prevents children from being stranded in an open check-in state indefinitely.",
    estimatedTime: "1 min",
    steps: [
      {
        number: 1,
        title: "Automatic Midnight & 14-Hour Cutoff",
        description: "The backend server executes an automated safety sweep every 30 minutes. Any attendance record from a past calendar day or open for > 14 hours is automatically closed.",
      },
      {
        number: 2,
        title: "Safety Stamp in Audit Records",
        description: "Auto-closed records are marked with method 'system_eod_autoclose' and station 'Auto-Safety Cutoff (24h)' for full transparency.",
      },
      {
        number: 3,
        title: "Duplicate Check-In Prevention",
        description: "When a child checks in today, the system automatically resolves any prior stale sessions first and prevents creating duplicate active records for the same day."
      }
    ]
  }
];

// ─── FAQ Accordion Data ───────────────────────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
  category: string;
  roles: ("parent" | "staff" | "volunteer" | "admin")[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Check-In & Kiosk",
    question: "What should I do if a parent loses their Parent Claim Ticket?",
    answer: "Staff and Admins can perform an authorized checkout by verifying the guardian's government photo ID against the registered parent profile in the system. When completing the checkout, enter an 'Override Reason' (e.g. 'Verified driver license — physical ticket lost'). This ensures safety while maintaining a 100% compliant audit log.",
    roles: ["staff", "volunteer", "admin"]
  },
  {
    category: "Check-In & Kiosk",
    question: "Can a child be checked in more than once on the same day?",
    answer: "No. KiddoChecker features built-in duplicate prevention. If a child is already checked in and present today, the kiosk and staff portal will show '(Already Present Today)' and prevent creating a duplicate record.",
    roles: ["parent", "staff", "admin"]
  },
  {
    category: "Check-In & Kiosk",
    question: "How does the Fast-Pass PIN work for Summer Camp & Events?",
    answer: "Every family receives a unique 6-digit Fast-Pass PIN via email prior to major events. When arriving at the kiosk, parents select 'Fast-Pass PIN', type their code, and all registered children are instantly loaded on screen for 1-tap admission.",
    roles: ["parent", "staff", "admin"]
  },
  {
    category: "Safety & Medical",
    question: "How are severe allergies displayed on printed labels and rosters?",
    answer: "Any child with registered allergies (e.g., Peanuts, Dairy, Penicillin) will have a prominent, bold red warning banner printed across their adhesive name badge. Classroom teachers also see a medical alert icon on their digital class rosters.",
    roles: ["parent", "staff", "admin"]
  },
  {
    category: "Printing & Hardware",
    question: "Which label printers are supported?",
    answer: "KiddoChecker supports Brother QL series (e.g. QL-800, QL-820NWB, QL-1100), Zebra ZD series, DYMO LabelWriter, and all standard desktop printers via local network IP or browser print dialog.",
    roles: ["admin", "staff"]
  },
  {
    category: "Printing & Hardware",
    question: "How do I lock down kiosk terminals to church Wi-Fi only?",
    answer: "In Kiosk Settings under Admin Configuration, enable 'Location IP Lockdown' and specify your church facility's public or subnet IP ranges. Any attempt to access kiosk check-in from unauthorized external networks will be blocked.",
    roles: ["admin"]
  },
  {
    category: "Family Profile",
    question: "Can I add secondary emergency contacts or authorized pickup guardians?",
    answer: "Yes. In 'My Profile' or 'My Children', you can list trusted family members, emergency contact names, and direct phone numbers. Staff will see these authorized individuals during checkout verification.",
    roles: ["parent"]
  },
  {
    category: "Reports & Compliance",
    question: "How long are liability audit logs kept in the system?",
    answer: "All check-in timestamps, check-out timestamps, guardian identities, station names, medical notes, and staff overrides are stored indefinitely in the secure Azure PostgreSQL database for historical auditing and compliance.",
    roles: ["admin"]
  }
];

const HelpDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const { userRole, isAdmin, isSuperAdmin, isStaff, isTeacher, isParent, isVolunteer } = useAuth();

  // Determine current user's default role tab
  const defaultTab = useMemo(() => {
    if (isAdmin || isSuperAdmin) return "admin";
    if (isStaff || isTeacher) return "staff";
    if (isVolunteer) return "volunteer";
    if (isParent) return "parent";
    return "all";
  }, [isAdmin, isSuperAdmin, isStaff, isTeacher, isVolunteer, isParent]);

  // Filter Step Guides
  const filteredGuides = useMemo(() => {
    return STEP_GUIDES.filter(guide => {
      // Role matching
      const roleMatch = selectedRole === "all" || guide.targetRole === selectedRole || guide.targetRole === "all";
      if (!roleMatch) return false;

      // Search term matching
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const titleMatch = guide.title.toLowerCase().includes(term);
      const summaryMatch = guide.summary.toLowerCase().includes(term);
      const stepMatch = guide.steps.some(s => s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term));
      const categoryMatch = guide.category.toLowerCase().includes(term);
      return titleMatch || summaryMatch || stepMatch || categoryMatch;
    });
  }, [selectedRole, searchTerm]);

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(faq => {
      // Role matching
      const roleMatch = selectedRole === "all" || faq.roles.includes(selectedRole as any);
      if (!roleMatch) return false;

      // Search term matching
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term) || faq.category.toLowerCase().includes(term);
    });
  }, [selectedRole, searchTerm]);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-10 py-6 pb-24 px-4 sm:px-6">
        
        {/* ─── Hero Header Banner ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 sm:p-12 text-white shadow-2xl border border-indigo-500/20">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              Comprehensive Knowledge Base & How-To Guides
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              How Can We Help You Today?
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Step-by-step instructions, safety protocols, hardware setup, and best practices tailored specifically to your role.
            </p>

            {/* Live Search Bar */}
            <div className="relative pt-4 max-w-2xl">
              <Search className="absolute left-4 top-1/2 mt-2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search guides (e.g. 'check in child', 'print tag', 'allergies', 'reports', 'PIN')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 focus:border-white/40 transition-all font-semibold text-base shadow-inner backdrop-blur-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 mt-2 -translate-y-1/2 text-xs text-slate-400 hover:text-white font-bold bg-white/10 px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Role Switcher Tabs ────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Book className="h-6 w-6 text-primary" />
                Select Your Role
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Filter interactive guides and workflows based on your responsibilities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/60">
              <Button
                variant={selectedRole === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRole("all")}
                className="rounded-xl font-bold text-xs"
              >
                All Roles
              </Button>
              <Button
                variant={selectedRole === "parent" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRole("parent")}
                className="rounded-xl font-bold text-xs"
              >
                Parents & Families
              </Button>
              <Button
                variant={selectedRole === "staff" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRole("staff")}
                className="rounded-xl font-bold text-xs"
              >
                Staff & Teachers
              </Button>
              <Button
                variant={selectedRole === "volunteer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRole("volunteer")}
                className="rounded-xl font-bold text-xs"
              >
                Volunteers
              </Button>
              <Button
                variant={selectedRole === "admin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRole("admin")}
                className="rounded-xl font-bold text-xs"
              >
                Administrators
              </Button>
            </div>
          </div>

          {/* ─── Step-By-Step Guides Grid ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGuides.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-card rounded-3xl border border-dashed border-border/60">
                <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground">No Guides Match Your Search</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  Try searching for keywords like "check in", "print", "safety", "PIN", or clear your filter.
                </p>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedRole("all"); }} className="mt-4 rounded-xl font-bold">
                  Reset Search & Filters
                </Button>
              </div>
            ) : (
              filteredGuides.map((guide) => {
                const IconComponent = guide.icon;
                return (
                  <Card key={guide.id} className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all rounded-3xl bg-card">
                    <CardHeader className="p-6 pb-4 border-b bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border ${guide.roleBadgeColor}`}>
                          {guide.roleBadge}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {guide.estimatedTime} read
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-black tracking-tight text-foreground">
                            {guide.title}
                          </CardTitle>
                          <CardDescription className="text-xs font-medium leading-relaxed">
                            {guide.summary}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        {guide.steps.map((step) => (
                          <div key={step.number} className="flex items-start gap-3.5 group">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              {step.number}
                            </div>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-foreground leading-tight">
                                {step.title}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                              {step.tip && (
                                <div className="mt-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-medium flex items-start gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                  <span><strong className="font-bold">Pro Tip:</strong> {step.tip}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {guide.actionLink && (
                        <div className="pt-3 border-t border-border/40 flex justify-end">
                          <Button asChild size="sm" className="rounded-xl font-bold gap-2 text-xs">
                            <Link to={guide.actionLink.url}>
                              {guide.actionLink.text}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Frequently Asked Questions (Accordion) ────────────────────── */}
        <div className="space-y-6 pt-6">
          <div className="border-b border-border/40 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Quick answers to the most common questions across check-in, printing, security, and child safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq, index) => (
              <Collapsible key={index} className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:border-primary/40 transition-all">
                <CollapsibleTrigger className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/5 font-medium space-y-2">
                  <p>{faq.answer}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applies to:</span>
                    {faq.roles.map(r => (
                      <Badge key={r} variant="secondary" className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* ─── Direct Support / Safety Hotline Card ──────────────────────── */}
        <Card className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <LifeBuoy className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight text-foreground">Need Immediate On-Site Support?</h3>
                <p className="text-sm text-muted-foreground font-medium max-w-xl">
                  If you experience printer hardware issues or require manual security overrides during Sunday service, notify the Lead Check-In Supervisor or Ministry Director immediately.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button asChild variant="outline" className="rounded-2xl font-bold h-12 px-6">
                <Link to="/attendance">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Live Attendance
                </Link>
              </Button>
              <Button asChild className="rounded-2xl font-bold h-12 px-6 shadow-md">
                <Link to="/check-in">
                  <Monitor className="mr-2 h-4 w-4" />
                  Launch Kiosk
                </Link>
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </ModernLayout>
  );
};

export default HelpDocumentation;
