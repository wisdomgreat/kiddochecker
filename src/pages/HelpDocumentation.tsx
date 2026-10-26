import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
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
  FileCheck,
  FileText,
  PrinterIcon,
  Download,
  Flame,
  CheckSquare,
  Square,
  Info,
  Calendar,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Wrench,
  AlertOctagon,
  Award,
  Bell,
  Vibrate,
  VolumeX,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

// ─── Interfaces ─────────────────────────────────────────────────────────────
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
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: {
    number: number;
    title: string;
    description: string;
    tip?: string;
    keyAction?: string;
  }[];
  actionLink?: {
    text: string;
    url: string;
  };
  cheatSheetSummary?: string[];
}

interface CheatSheet {
  id: string;
  title: string;
  targetRole: string;
  icon: any;
  color: string;
  items: string[];
}

// ─── Step-By-Step Interactive Guide Data (20+ In-Depth Guides) ──────────────
const STEP_GUIDES: StepGuide[] = [
  // ── PARENT GUIDES ──
  {
    id: "parent-kiosk-checkin",
    title: "How to Check In Your Child at the Kiosk",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Check-In & Kiosk",
    icon: Monitor,
    summary: "Check in your children in under 10 seconds using your phone number, 4 to 6-digit PIN, QR code, or NFC tap.",
    estimatedTime: "1 min",
    difficulty: "Beginner",
    actionLink: { text: "View Family PIN & QR Code", url: "/parent/profile" },
    cheatSheetSummary: [
      "1. Approach the kiosk terminal in the church lobby",
      "2. Enter last 4 digits of phone or scan mobile QR",
      "3. Enter 4 to 6-digit Security PIN to confirm authorized access",
      "4. Check each child attending and confirm health screening",
      "5. Collect printed child name tag and Parent Claim Ticket"
    ],
    steps: [
      {
        number: 1,
        title: "Locate Kiosk & Enter Phone Number or Tap NFC",
        description: "On the terminal screen, enter the last 4 digits of your registered mobile number, type your full phone number, or simply tap your phone/key-tag against the NFC reader.",
        tip: "If you received a Fast-Pass PIN in your email, select 'Fast-Pass PIN' to skip typing your phone number.",
        keyAction: "Type phone or tap NFC"
      },
      {
        number: 2,
        title: "Enter Your 4 to 6-Digit Security PIN",
        description: "Enter your private 4 to 6-digit Security PIN (found on your Profile page) to confirm you are the authorized guardian.",
        tip: "Keep your PIN confidential. It ensures only approved family members can access your family's check-in profile.",
        keyAction: "Enter 4 to 6-digit PIN"
      },
      {
        number: 3,
        title: "Select Children & Health Screening",
        description: "Check the checkbox next to each child attending today. Confirm they are symptom-free (no fever or cough in the last 24 hours).",
        keyAction: "Select children attending"
      },
      {
        number: 4,
        title: "Collect Printed Name Tag & Claim Ticket",
        description: "The kiosk automatically prints a Child Name Tag (stick to child's shirt/back) and a matching Parent Claim Ticket with a unique security code.",
        tip: "Do NOT discard your Parent Claim Ticket — staff will match this security code before releasing your child during pick-up!",
        keyAction: "Collect & attach badges"
      }
    ]
  },
  {
    id: "parent-sanctuary-paging",
    title: "How the Sanctuary Pager & Silent Mobile Alerts Work",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
    category: "Safety & Security",
    icon: Bell,
    summary: "Understand how our children's ministry silently and discreetly reaches you during worship using private sanctuary screen codes, phone vibration, and in-app alerts.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    actionLink: { text: "View My Pager Code", url: "/parent/profile" },
    cheatSheetSummary: [
      "1. Find your 4-character Family Pager Code on your dashboard banner or profile",
      "2. Keep your phone on silent or vibrate during worship service",
      "3. If child needs care, your phone pulses with a silent haptic vibration pattern",
      "4. Only your 4-character code flashes on the sanctuary screen — names are never publicized",
      "5. Tap 'I'm On My Way' in the app so teachers know you are coming"
    ],
    steps: [
      {
        number: 1,
        title: "Find Your Family Sanctuary Pager Code",
        description: "Your family is assigned a private 4-character Sanctuary Pager Code (e.g. #A4B2). You can view it anytime at the top of your Parent Dashboard, on your printed Parent Claim Ticket, and inside your Profile page.",
        tip: "Keep this 4-character code in mind or leave your KiddoChecker dashboard open on your phone during the service.",
        keyAction: "Locate code on dashboard"
      },
      {
        number: 2,
        title: "When Classroom Leaders Request Your Care",
        description: "If your child is inconsolable, needs assistance with a diaper/wardrobe change, requests a parent, or requires health attention, classroom leaders trigger a silent callout from their classroom terminal.",
        keyAction: "Leader triggers assistance"
      },
      {
        number: 3,
        title: "Silent Phone Vibration & In-App Alert",
        description: "Your phone immediately receives a high-priority assistance alert banner and pulses with a discreet haptic vibration pattern (two pulses followed by a longer buzz). It will NEVER make loud ringing noises that disturb the sermon or worship prayer.",
        tip: "You can test your phone's vibration right now by clicking 'Sanctuary Pager Code' on your dashboard and tapping 'Test Phone Vibration'.",
        keyAction: "Discreet mobile haptic pulse"
      },
      {
        number: 4,
        title: "Discreet Sanctuary Screen Projection",
        description: "For parents whose phones are in a bag or pocket, your 4-character code is flashed discreetly on the sanctuary projector screen (e.g., 'PAGER # A4B2'). Your child's and family's names are never announced or displayed publicly to protect your privacy.",
        keyAction: "Private screen flash"
      },
      {
        number: 5,
        title: "Tap 'I'm On My Way' (Acknowledge)",
        description: "When the alert appears on your phone, tap 'I'm On My Way'. This immediately notifies classroom leaders that you have responded and are heading to the children's wing, silences further alerts, and provides reassurance.",
        keyAction: "Tap Acknowledge"
      }
    ]
  },
  {
    id: "parent-add-children",
    title: "How to Register Children & Record Critical Allergies",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
    category: "Children & Medical",
    icon: Baby,
    summary: "Add your children to the registry, set emergency contacts, and record vital allergies or medical alerts.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    actionLink: { text: "Manage My Children", url: "/parent/children" },
    cheatSheetSummary: [
      "1. Go to 'My Children' from the sidebar menu",
      "2. Click '+ Register Child'",
      "3. Fill in legal name, birthdate, and grade level",
      "4. List all food allergies (peanuts, dairy) and EpiPen needs",
      "5. Click Save — child is instantly active across all kiosks"
    ],
    steps: [
      {
        number: 1,
        title: "Navigate to 'My Children'",
        description: "Click on 'My Children' in your sidebar or parent dashboard menu.",
        keyAction: "Open My Children"
      },
      {
        number: 2,
        title: "Click 'Register Child' & Fill Details",
        description: "Provide the child's full legal name, date of birth, age, gender, and school grade level.",
        keyAction: "Fill child details"
      },
      {
        number: 3,
        title: "Highlight Allergies and Special Needs",
        description: "Enter any food allergies (peanuts, dairy, gluten, shellfish), medical conditions, or EpiPen instructions. These will be highlighted in bold red on child name tags and teacher digital rosters.",
        tip: "Always inform the lead classroom teacher of severe allergies during drop-off.",
        keyAction: "Enter allergy flags"
      },
      {
        number: 4,
        title: "Save Profile",
        description: "Click 'Save Child'. Your child will immediately appear on all check-in kiosk terminals across the entire campus.",
        keyAction: "Click Save"
      }
    ]
  },
  {
    id: "parent-pickup-guardians",
    title: "How to Authorize Alternate Pick-Up Guardians",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Safety & Security",
    icon: ShieldCheck,
    summary: "Authorize grandparents, relatives, or family friends to pick up your children safely.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    actionLink: { text: "Edit Profile & Guardians", url: "/parent/profile" },
    steps: [
      {
        number: 1,
        title: "Open Family Profile",
        description: "Go to 'My Profile' in the parent portal.",
        keyAction: "Open Profile"
      },
      {
        number: 2,
        title: "Add Emergency Contacts & Authorized Pickups",
        description: "Enter the full legal name, phone number, and relationship of trusted individuals permitted to check out your children.",
        keyAction: "Enter guardian info"
      },
      {
        number: 3,
        title: "Share Claim Ticket or Digital Pass",
        description: "Inform the authorized pickup person to carry their government photo ID and the physical Parent Claim Ticket or digital claim QR code on dismissal.",
        tip: "Staff will verify photo ID against your authorized list before releasing any child."
      }
    ]
  },
  {
    id: "parent-rewards",
    title: "How Kids Earn Points & Redeem Rewards",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Gamification & Rewards",
    icon: Trophy,
    summary: "Encourage consistent attendance and scripture memory with our automated points and prize store.",
    estimatedTime: "1 min",
    difficulty: "Beginner",
    actionLink: { text: "View Rewards Store", url: "/parent/rewards" },
    steps: [
      {
        number: 1,
        title: "Automatic Check-In Points",
        description: "Every time your child checks in on time on Sunday or during mid-week service, their account automatically earns attendance reward points.",
        keyAction: "Check in on time"
      },
      {
        number: 2,
        title: "Track Total Points on the Parent Portal",
        description: "Check your Parent Dashboard or 'Rewards' tab to see point balances and active attendance streaks for each child.",
        keyAction: "View point balance"
      },
      {
        number: 3,
        title: "Browse Prize Catalog & Request Redemption",
        description: "Select available prizes from the store. Teachers and ministry leaders will present the gift at the end of class!",
        keyAction: "Select prize"
      }
    ]
  },
  {
    id: "parent-family-connect",
    title: "How to Message Teachers via Family Connect",
    targetRole: "parent",
    roleBadge: "Parents & Families",
    roleBadgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
    category: "Communication",
    icon: Mail,
    summary: "Send real-time questions, pickup updates, or medication reminders directly to classroom staff.",
    estimatedTime: "1 min",
    difficulty: "Beginner",
    actionLink: { text: "Open Messages", url: "/parent/messages" },
    steps: [
      {
        number: 1,
        title: "Navigate to Messages",
        description: "Click 'Messages' in your parent navigation sidebar.",
        keyAction: "Open Messages"
      },
      {
        number: 2,
        title: "Select Classroom or Teacher",
        description: "Choose your child's assigned room (e.g. Toddlers, Elementary) or lead teacher from the recipient list.",
        keyAction: "Pick recipient"
      },
      {
        number: 3,
        title: "Send Update / Early Pickup Notice",
        description: "Type your message (e.g. 'Picking up Emma 15 minutes early today'). The teacher receives an instant notification in the classroom portal.",
        keyAction: "Send message"
      }
    ]
  },

  // ── STAFF & TEACHER GUIDES ──
  {
    id: "staff-admissions",
    title: "How to Perform Manual Admissions & Health Screening",
    targetRole: "staff",
    roleBadge: "Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Classroom Management",
    icon: UserCheck,
    summary: "Manually admit children without physical tags, log health screenings, and assign classrooms.",
    estimatedTime: "2 mins",
    difficulty: "Intermediate",
    actionLink: { text: "Open Attendance Ledger", url: "/attendance" },
    cheatSheetSummary: [
      "1. Open Attendance Page from staff sidebar",
      "2. Click '+ Manual Check-In' button",
      "3. Search child name in registered directory",
      "4. Confirm health check (no fever/cough) and assign room",
      "5. Click 'Check In' — stamped into Master Liability Trail"
    ],
    steps: [
      {
        number: 1,
        title: "Open the Attendance Page or Kiosk Override",
        description: "From the staff sidebar, click 'Attendance'. You will see the real-time headcount and active student list.",
        keyAction: "Open Attendance"
      },
      {
        number: 2,
        title: "Click 'Manual Check-In'",
        description: "Click the '+ Manual Check-In' button. Search for the child in the registered roster.",
        tip: "Children who are already checked in today will be disabled with '(Already Present Today)' to prevent accidental duplicate entries.",
        keyAction: "Search child"
      },
      {
        number: 3,
        title: "Assign Learning Environment & Room",
        description: "Select the assigned classroom (e.g. Toddlers, Kindergarten, Elementary, Purity) and confirm the health screening checklist.",
        keyAction: "Select class & health"
      },
      {
        number: 4,
        title: "Authorize Check-In",
        description: "Click 'Check In'. The action is stamped into the Master Liability Audit Trail with your staff credentials.",
        keyAction: "Authorize check-in"
      }
    ]
  },
  {
    id: "staff-duty-of-care",
    title: "How to Log Duty of Care Events (Diapers, Feedings, Incidents)",
    targetRole: "staff",
    roleBadge: "Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Duty of Care & Safety",
    icon: HeartPulse,
    summary: "Record diaper changes, bottle feedings, medication administrations, and minor incidents in real time.",
    estimatedTime: "1 min",
    difficulty: "Intermediate",
    actionLink: { text: "Go to Attendance", url: "/attendance" },
    steps: [
      {
        number: 1,
        title: "Find the Child on the Active Roster",
        description: "On the Attendance page, locate the child in the currently present table.",
        keyAction: "Locate child"
      },
      {
        number: 2,
        title: "Open the 'Care Log' Menu",
        description: "Click the 3-dots action menu on the child's row and select 'Log Care Event'.",
        keyAction: "Click Log Care"
      },
      {
        number: 3,
        title: "Select Event Type & Add Notes",
        description: "Choose Diaper Change (Wet/BM), Bottle / Snack, Medication Administered, Nap Time, or Incident. Enter relevant observations.",
        keyAction: "Choose type & notes"
      },
      {
        number: 4,
        title: "Submit Log",
        description: "The note is permanently stored in the audit log and instantly viewable by parents and administrative supervisors.",
        keyAction: "Save log"
      }
    ]
  },
  {
    id: "staff-checkout",
    title: "How to Execute Secure Check-Out & Guardian Verification",
    targetRole: "staff",
    roleBadge: "Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Child Safety",
    icon: ShieldCheck,
    summary: "Match the Parent Claim Ticket security code or capture a digital signature before dismissing any child.",
    estimatedTime: "1 min",
    difficulty: "Intermediate",
    actionLink: { text: "Open Check-Out Station", url: "/check-out" },
    cheatSheetSummary: [
      "1. Scan parent claim ticket or search child name",
      "2. Verify matching 4-character code on child's badge",
      "3. Verify guardian face photo against profile",
      "4. (If ticket lost) Check photo ID & enter Override Reason",
      "5. Click 'Complete Check-Out' to release child"
    ],
    steps: [
      {
        number: 1,
        title: "Scan Parent Claim Ticket or Search Name",
        description: "At the dismissal desk, scan the QR code on the parent's claim ticket or search the child's name in the Check-Out Station.",
        keyAction: "Scan claim QR"
      },
      {
        number: 2,
        title: "Verify Security Match & Guardian ID",
        description: "Confirm that the 4-character security code on the child's name tag matches the parent's ticket and that the photo matches the guardian profile.",
        keyAction: "Verify code match"
      },
      {
        number: 3,
        title: "Staff Override (If Ticket is Missing)",
        description: "If a parent lost their physical ticket, ask for government photo ID, verify their name in the family directory, and enter an admin override reason.",
        tip: "All manual overrides require entering an explicit reason which is logged in the permanent forensic liability ledger.",
        keyAction: "Enter override reason"
      },
      {
        number: 4,
        title: "Confirm Release",
        description: "Click 'Complete Check-Out'. The child is safely checked out and the real-time headcount updates immediately.",
        keyAction: "Complete checkout"
      }
    ]
  },
  {
    id: "staff-shifts-documents",
    title: "How to Clock In for Shifts & Upload Background Checks",
    targetRole: "staff",
    roleBadge: "Staff & Teachers",
    roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    category: "Staff Management",
    icon: Calendar,
    summary: "View assigned teaching shifts, log hours, and keep safety screening certifications up to date.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    actionLink: { text: "Staff Schedules & Shifts", url: "/staff/schedules" },
    steps: [
      {
        number: 1,
        title: "View Assigned Schedule",
        description: "Navigate to 'Schedules' to view upcoming service assignments and assigned classroom ratios.",
        keyAction: "Check schedule"
      },
      {
        number: 2,
        title: "Clock In at Kiosk or Portal",
        description: "Use your 4-digit Staff PIN at any kiosk station or tap 'Clock In' in your staff portal.",
        keyAction: "Clock in with PIN"
      },
      {
        number: 3,
        title: "Upload Background Check Documents",
        description: "In 'My Documents', upload your latest background check certificate or CPR license for admin verification.",
        keyAction: "Upload certs"
      }
    ]
  },

  // ── VOLUNTEER GUIDES ──
  {
    id: "volunteer-kiosk-assistance",
    title: "Sunday Lobby Reception & Queue Assistance",
    targetRole: "volunteer",
    roleBadge: "Volunteers",
    roleBadgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    category: "Guest Experience",
    icon: Users,
    summary: "Welcome families at the lobby kiosk, assist with printer tags, and guide children to classrooms.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    cheatSheetSummary: [
      "1. Greet families warmly at the kiosk station",
      "2. Returning families: Type phone number or scan QR",
      "3. First-time guests: Tap 'New Family Registration'",
      "4. Ensure child badge is stuck to shirt/back",
      "5. Remind parent to keep Parent Claim Ticket safe"
    ],
    steps: [
      {
        number: 1,
        title: "Greet Families with a Smile",
        description: "Stand beside the kiosk station to welcome parents. Ask if they are registered or visiting for the first time.",
        keyAction: "Greet families"
      },
      {
        number: 2,
        title: "Guide Returning Families",
        description: "Instruct parents to enter their phone number or scan their mobile QR pass on the barcode reader.",
        keyAction: "Assist with phone entry"
      },
      {
        number: 3,
        title: "Assist First-Time Guests",
        description: "Guide new guests to tap 'New Family Registration' on the kiosk. Help them fill in basic contact details and child allergy flags in under 60 seconds.",
        keyAction: "Open guest registration"
      },
      {
        number: 4,
        title: "Ensure Tags are Attached",
        description: "Ensure the printed name tag is placed on the child's back or front shirt and remind the parent to keep their Parent Claim Ticket safe.",
        keyAction: "Hand parent claim ticket"
      }
    ]
  },
  {
    id: "volunteer-printer-troubleshooting",
    title: "Quick Label Printer Troubleshooting for Volunteers",
    targetRole: "volunteer",
    roleBadge: "Volunteers",
    roleBadgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    category: "Hardware & Setup",
    icon: Printer,
    summary: "Fix label jams, replace paper rolls, and handle flashing status lights during busy morning rushes.",
    estimatedTime: "2 mins",
    difficulty: "Beginner",
    steps: [
      {
        number: 1,
        title: "Check Green Status Light",
        description: "Ensure the printer power light is steady green. If flashing red, the roll is empty or the lid is open.",
        keyAction: "Check power light"
      },
      {
        number: 2,
        title: "Clearing a Label Jam",
        description: "Open the top cover, gently pull out jammed labels, and align the label roll between the guides.",
        tip: "Never pull labels backward through the roller mechanism.",
        keyAction: "Clear jammed tape"
      },
      {
        number: 3,
        title: "Press Feed Button Once",
        description: "Close the cover firmly and press the Feed button once to align the label cut mark.",
        keyAction: "Press Feed"
      }
    ]
  },

  // ── ADMIN & SUPER ADMIN GUIDES ──
  {
    id: "admin-hardware-printing",
    title: "How to Configure Thermal Printers & Kiosks",
    targetRole: "admin",
    roleBadge: "Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Hardware & Infrastructure",
    icon: Printer,
    summary: "Set up Brother, Zebra, DYMO, or network thermal label printers with direct IP printing.",
    estimatedTime: "3 mins",
    difficulty: "Advanced",
    actionLink: { text: "Device Enrollment", url: "/devices" },
    cheatSheetSummary: [
      "1. Enroll kiosk in 'Device Enrollment' to get hardware token",
      "2. Enter local IP address of thermal printer (e.g. 192.168.1.150)",
      "3. Set label size to continuous 2.25\" x 3.5\" thermal tape",
      "4. Click 'Test Print Label' to verify badge & claim ticket",
      "5. Enable Location IP Lockdown to secure campus network"
    ],
    steps: [
      {
        number: 1,
        title: "Enroll Station in 'Device Enrollment'",
        description: "Navigate to 'Device Enrollment' in the admin sidebar. Click 'Enroll New Device' to generate an authorized hardware token.",
        keyAction: "Enroll hardware device"
      },
      {
        number: 2,
        title: "Configure Printer Target IP & Model",
        description: "In Kiosk Settings, enter the local IP address of your thermal printer (e.g. 192.168.1.150) or select System Dialog Printing.",
        tip: "Ensure your printer is set to standard continuous or 2.25\" x 3.5\" thermal adhesive labels.",
        keyAction: "Enter printer IP"
      },
      {
        number: 3,
        title: "Perform a Test Print",
        description: "Click 'Test Print Label'. Confirm that a Child Badge and Parent Claim Ticket print separately with crisp QR codes and bold allergy banners.",
        keyAction: "Run test print"
      },
      {
        number: 4,
        title: "Enable Network IP Lockdown",
        description: "Lock the station to your church's physical Wi-Fi IP address range to prevent unauthorized external access.",
        keyAction: "Lock IP range"
      }
    ]
  },
  {
    id: "admin-liability-reports",
    title: "How to Generate Master Liability Audit Reports",
    targetRole: "admin",
    roleBadge: "Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Compliance & Safety",
    icon: FileSpreadsheet,
    summary: "Inspect and export forensic check-in ledgers with timestamped guardian identities, station names, and durations.",
    estimatedTime: "2 mins",
    difficulty: "Advanced",
    actionLink: { text: "View Reports & Analytics", url: "/reports" },
    steps: [
      {
        number: 1,
        title: "Open the Enhanced Reports & Analytics Suite",
        description: "Navigate to 'Reports' in the sidebar menu.",
        keyAction: "Open Reports"
      },
      {
        number: 2,
        title: "Select 'Master Liability Audit Trail' Tab",
        description: "This view presents all 60+ forensic attendance records including child ages, allergy flags, check-in actor name & role, check-out actor name & role, station name, and duration.",
        keyAction: "View Audit Ledger"
      },
      {
        number: 3,
        title: "Filter by Date Range or Class",
        description: "Select custom dates (e.g. Last 7 Days, Month to Date, or specific Sunday service).",
        keyAction: "Set date filter"
      },
      {
        number: 4,
        title: "Export to CSV / Excel",
        description: "Click 'Export Audit Trail' to download a clean CSV file for compliance auditing, insurance verification, or pastoral records.",
        keyAction: "Export CSV"
      }
    ]
  },
  {
    id: "admin-email-fastpass",
    title: "How to Broadcast Summer Camp Fast-Pass PINs",
    targetRole: "admin",
    roleBadge: "Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "Communication",
    icon: Mail,
    summary: "Deliver personalized Fast-Pass PINs to all registered church families in a single click with delivery tracking.",
    estimatedTime: "2 mins",
    difficulty: "Intermediate",
    actionLink: { text: "Email Delivery Logs", url: "/admin/email-logs" },
    steps: [
      {
        number: 1,
        title: "Open Email Delivery Logs",
        description: "Navigate to 'Email Delivery Logs' in the admin configuration menu.",
        keyAction: "Open Email Logs"
      },
      {
        number: 2,
        title: "Click 'Broadcast Summer Camp Pass'",
        description: "Click the purple 'Broadcast Summer Camp Pass' button. The Azure Communication Services engine generates unique PINs for every parent.",
        keyAction: "Broadcast PINs"
      },
      {
        number: 3,
        title: "Monitor Real-Time Email Delivery",
        description: "Inspect the live delivery table to verify that each parent's email status shows 'Delivered' with timestamp and recipient details.",
        keyAction: "Track delivery"
      },
      {
        number: 4,
        title: "Send Test Email (Optional)",
        description: "Use the 'Send Test Email' button to verify your Azure Communication Services connection string and template formatting at any time.",
        keyAction: "Send test email"
      }
    ]
  },
  {
    id: "admin-safety-cutoff",
    title: "Understanding the 24-Hour Safety Cutoff & Stale Session Sweep",
    targetRole: "admin",
    roleBadge: "Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "System Safeguards",
    icon: Shield,
    summary: "How our autonomous background engine prevents children from being stranded in an open check-in state indefinitely.",
    estimatedTime: "1 min",
    difficulty: "Intermediate",
    steps: [
      {
        number: 1,
        title: "Automatic Midnight & 14-Hour Cutoff",
        description: "The backend server executes an automated safety sweep every 30 minutes. Any attendance record from a past calendar day or open for > 14 hours is automatically closed.",
        keyAction: "Runs automatically"
      },
      {
        number: 2,
        title: "Safety Stamp in Audit Records",
        description: "Auto-closed records are marked with method 'system_eod_autoclose' and station 'Auto-Safety Cutoff (24h)' for full transparency.",
        keyAction: "Audited in logs"
      },
      {
        number: 3,
        title: "Duplicate Check-In Prevention",
        description: "When a child checks in today, the system automatically resolves any prior stale sessions first and prevents creating duplicate active records for the same day.",
        keyAction: "Zero duplicates"
      }
    ]
  },
  {
    id: "admin-user-roles-pins",
    title: "How to Manage User Roles & Generate Staff PINs",
    targetRole: "admin",
    roleBadge: "Administrators",
    roleBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    category: "User Administration",
    icon: Users,
    summary: "Assign Admin, Teacher, Staff, and Parent roles, and generate private 4-digit staff kiosk PINs.",
    estimatedTime: "2 mins",
    difficulty: "Intermediate",
    actionLink: { text: "User Management Directory", url: "/users" },
    steps: [
      {
        number: 1,
        title: "Open User Directory",
        description: "Navigate to 'User Management' in the admin sidebar.",
        keyAction: "Open Users"
      },
      {
        number: 2,
        title: "Select User & Click Edit",
        description: "Click 'Edit' on any user row to open their profile modal.",
        keyAction: "Edit user"
      },
      {
        number: 3,
        title: "Assign Role & Generate Staff PIN",
        description: "Assign the appropriate role (Super Admin, Admin, Teacher, Volunteer, Parent) and generate a secure 4-digit Staff PIN for kiosk overrides.",
        keyAction: "Set role & PIN"
      },
      {
        number: 4,
        title: "Save Permissions",
        description: "Click 'Save Changes'. The user's role-based access permissions update instantaneously.",
        keyAction: "Save user"
      }
    ]
  }
];

// ─── Printable Cheat Sheets Data ────────────────────────────────────────────
const CHEAT_SHEETS: CheatSheet[] = [
  {
    id: "sunday-volunteer-checklist",
    title: "Sunday Morning Volunteer Checklist",
    targetRole: "Volunteers & Greeters",
    icon: Users,
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200",
    items: [
      "Turn on all Kiosk tablets and verify steady green light on thermal printers.",
      "Place Parent Claim Ticket reminder card on check-in desk.",
      "Greet arriving families and direct them to tap NFC or enter last 4 digits of phone.",
      "Ensure Child Name Tag is firmly placed on front/back of child's clothing.",
      "Hand matching Parent Claim Ticket to the guardian and remind them to keep it for dismissal.",
      "Direct new first-time visitors to the welcome registration tablet."
    ]
  },
  {
    id: "dismissal-safety-protocol",
    title: "Dismissal & Pick-Up Security Protocol",
    targetRole: "Teachers & Security Staff",
    icon: ShieldCheck,
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-200",
    items: [
      "Never release a child without matching the 4-character code on the Parent Claim Ticket.",
      "Verify the guardian face against the registered profile photo.",
      "If ticket is missing: Demand government photo ID, verify in system directory, and enter mandatory override reason.",
      "Log any care events (diaper changes, feedings, incident reports) prior to dismissal.",
      "Click 'Complete Check-Out' in the Check-Out Station to immediately deduct from active room headcount."
    ]
  },
  {
    id: "printer-hardware-guide",
    title: "Thermal Printer Quick Setup Reference",
    targetRole: "Administrators & Tech Team",
    icon: Printer,
    color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-900 dark:text-indigo-200",
    items: [
      "Recommended media: Continuous standard 2.25\" x 3.5\" thermal adhesive labels.",
      "Verify static IP assigned on church router (e.g., 192.168.1.150).",
      "In Admin Kiosk Settings, test print before Sunday 8:00 AM service.",
      "Check Brother/Zebra cutter mechanism is clean and free of adhesive residue.",
      "Enable Location IP Lockdown in Admin Settings to secure local network terminals."
    ]
  },
  {
    id: "sanctuary-paging-protocol",
    title: "Sanctuary Paging & Silent Mobile Alert Protocol",
    targetRole: "Parents, Staff & Media Team",
    icon: Bell,
    color: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-900 dark:text-sky-200",
    items: [
      "Every family has a unique 4-character Family Pager Code (e.g., #A4B2).",
      "Classroom leaders trigger a page when a child needs parent assistance (comfort, diaper, medical).",
      "Parent mobile device receives an in-app banner and silent rhythmic haptic vibration pulses.",
      "Auditory disruption is strictly prevented — no loud chimes or ringtones sound during worship.",
      "Only the 4-character code flashes on the sanctuary screen for privacy — child names are never displayed.",
      "Parents tap 'I'm On My Way' in the mobile app to immediately acknowledge and notify classroom leaders."
    ]
  },
  {
    id: "family-checkin-checklist",
    title: "Sunday Family Check-In & Pick-Up Guide",
    targetRole: "Parents & Families",
    icon: Baby,
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-900 dark:text-rose-200",
    items: [
      "Find your 4 to 6-digit Kiosk PIN or Kiosk Access QR code in your Family Profile before leaving home.",
      "At the church lobby, enter your phone number or scan your QR code at any check-in terminal.",
      "Check off attending children and verify any allergy warnings.",
      "Stick the printed Child Name Tag securely to your child's shirt/back.",
      "Keep the matching Parent Claim Ticket safe — staff will verify the 4-character code at pickup.",
      "Keep your phone on silent or vibrate during worship to receive discreet sanctuary paging notifications."
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
    category: "Safety & Security",
    question: "How will I know if my child needs me during the church service?",
    answer: "KiddoChecker uses a multi-layered silent notification protocol: (1) Your phone receives an in-app alert and vibrates with a silent haptic pulse pattern. (2) Your 4-character Family Pager Code (e.g. #A4B2) is projected discreetly onto the sanctuary screen. (3) An SMS backup is sent if unacknowledged. Your child's name is never publicly announced.",
    roles: ["parent", "volunteer", "staff", "admin"]
  },
  {
    category: "Safety & Security",
    question: "Will the mobile pager make loud sounds or ring during worship?",
    answer: "No. The system uses silent Web Vibration haptics ([450ms, 180ms, 450ms, 180ms, 700ms]) and silent on-screen notifications. It is engineered specifically for church worship environments to prevent audio interruptions.",
    roles: ["parent"]
  },
  {
    category: "Safety & Security",
    question: "Where do I find my family's Sanctuary Pager Code?",
    answer: "Your Sanctuary Pager Code is prominently displayed at the top of your Parent Dashboard, on your Parent Claim Ticket printed at the kiosk, and under 'Sanctuary Pager Code' on your Profile page.",
    roles: ["parent", "volunteer", "staff"]
  },
  {
    category: "Safety & Security",
    question: "How do classroom teachers know I am coming when paged?",
    answer: "When your phone vibrates or you open KiddoChecker, tap 'I'm On My Way'. This logs an immediate acknowledgment in the system and lets classroom leaders know you are in transit to the children's wing.",
    roles: ["parent", "staff", "volunteer"]
  },
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
  },
  {
    category: "Attendance & Rewards",
    question: "How do children redeem their points in the rewards store?",
    answer: "Parents or teachers can view active point balances in the Rewards portal. When a milestone is reached, click 'Request Redemption'. Ministry leaders confirm the gift distribution at the end of class.",
    roles: ["parent", "staff"]
  },
  {
    category: "Staff Operations",
    question: "How do teachers take live room headcounts on tablet devices?",
    answer: "Open the 'Attendance' page on any tablet. You can filter by assigned class (e.g. Nursery, Preschool, Elementary). The system displays present children, medical alerts, and logs any Duty of Care events in real time.",
    roles: ["staff", "admin"]
  }
];

const CATEGORIES = [
  "All Categories",
  "Check-In & Kiosk",
  "Children & Medical",
  "Safety & Security",
  "Classroom Management",
  "Duty of Care & Safety",
  "Hardware & Infrastructure",
  "Compliance & Safety",
  "Gamification & Rewards",
  "Communication",
  "Staff Management"
];

const HelpDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole, isAdmin, isSuperAdmin, isStaff, isTeacher, isParent, isVolunteer } = useAuth();
  const { toast } = useToast();

  const querySimulate = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("simulate") : null;
  const isPrivileged = isAdmin || isSuperAdmin || isStaff || isTeacher || isVolunteer || ["admin", "super_admin", "staff", "teacher", "volunteer"].includes(querySimulate || "");

  // If not privileged (parent or visitor), force role to parent
  const [selectedRole, setSelectedRole] = useState<string>(() => (isPrivileged ? "all" : "parent"));
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [activeGuideModal, setActiveGuideModal] = useState<StepGuide | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  // Filter Step Guides: strictly ensure parents never see staff/admin hardware or management guides
  const filteredGuides = useMemo(() => {
    return STEP_GUIDES.filter(guide => {
      // Role matching
      if (!isPrivileged) {
        if (guide.targetRole !== "parent" && guide.targetRole !== "all") return false;
      } else {
        const roleMatch = selectedRole === "all" || guide.targetRole === selectedRole || guide.targetRole === "all";
        if (!roleMatch) return false;
      }

      // Category matching
      const categoryMatch = selectedCategory === "All Categories" || guide.category === selectedCategory;
      if (!categoryMatch) return false;

      // Search term matching
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const titleMatch = guide.title.toLowerCase().includes(term);
      const summaryMatch = guide.summary.toLowerCase().includes(term);
      const stepMatch = guide.steps.some(s => s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term));
      const categoryTextMatch = guide.category.toLowerCase().includes(term);
      return titleMatch || summaryMatch || stepMatch || categoryTextMatch;
    });
  }, [selectedRole, selectedCategory, searchTerm, isPrivileged]);

  // Dynamic available categories based on visible guides for this user's role
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All Categories");
    const roleScopedGuides = isPrivileged
      ? (selectedRole === "all" ? STEP_GUIDES : STEP_GUIDES.filter(g => g.targetRole === selectedRole || g.targetRole === "all"))
      : STEP_GUIDES.filter(g => g.targetRole === "parent" || g.targetRole === "all");
    roleScopedGuides.forEach(g => cats.add(g.category));
    return Array.from(cats);
  }, [isPrivileged, selectedRole]);

  // Filter Cheat Sheets: Parents only see parent-facing cheat sheets
  const filteredCheatSheets = useMemo(() => {
    if (!isPrivileged) {
      return CHEAT_SHEETS.filter(sheet => sheet.id === "sanctuary-paging-protocol" || sheet.id === "family-checkin-checklist");
    }
    return CHEAT_SHEETS;
  }, [isPrivileged]);

  // Filter FAQs: Parents strictly only see FAQs where roles include parent
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(faq => {
      // Role matching
      if (!isPrivileged) {
        if (!faq.roles.includes("parent")) return false;
      } else {
        const roleMatch = selectedRole === "all" || faq.roles.includes(selectedRole as any);
        if (!roleMatch) return false;
      }

      // Search term matching
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term) || faq.category.toLowerCase().includes(term);
    });
  }, [selectedRole, searchTerm, isPrivileged]);

  const handleOpenWalkthrough = (guide: StepGuide) => {
    setActiveGuideModal(guide);
    setActiveStepIndex(0);
  };

  const toggleStepCompleted = (guideId: string, stepNumber: number) => {
    setCompletedSteps(prev => {
      const current = prev[guideId] || [];
      if (current.includes(stepNumber)) {
        return { ...prev, [guideId]: current.filter(n => n !== stepNumber) };
      } else {
        return { ...prev, [guideId]: [...current, stepNumber] };
      }
    });
  };

  const handleFeedback = (faqIndex: number, isHelpful: boolean) => {
    setFeedbackGiven(prev => ({ ...prev, [faqIndex]: true }));
    toast({
      title: isHelpful ? "Thank you!" : "Feedback Received",
      description: isHelpful ? "Glad this was helpful!" : "We will refine this answer to make it clearer.",
    });
  };

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-10 py-6 pb-28 px-4 sm:px-6">
        
        {/* ─── Clean & Professional Header ───────────────────────────────── */}
        <div className="bg-card border border-border/70 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                <Book className="h-3.5 w-3.5" />
                {isPrivileged ? "Documentation & Operations Manual" : "Family & Parent Help Center"}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isPrivileged ? "How-To Guides & Operations Manual" : "Family Help & How-To Guides"}
              </h1>
              
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                {isPrivileged
                  ? "Step-by-step instructions, child safety protocols, hardware setup, and best practices tailored for Staff, Volunteers, and Administrators."
                  : "Step-by-step instructions for Sunday check-in, silent sanctuary paging, guardian pickup authorizations, and allergy safety."}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 self-start md:self-center shrink-0 bg-muted/40 p-3 rounded-2xl border border-border/60">
              <div className="text-center px-3 border-r border-border/60">
                <div className="text-lg font-black text-foreground">{filteredGuides.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guides</div>
              </div>
              <div className="text-center px-3 border-r border-border/60">
                <div className="text-lg font-black text-foreground">{filteredFaqs.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">FAQs</div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-black text-foreground">{filteredCheatSheets.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Checklists</div>
              </div>
            </div>
          </div>

          {/* Clean Integrated Search Bar */}
          <div className="relative pt-2">
            <Search className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isPrivileged ? "Search by topic, feature, or keyword (e.g., 'check in child', 'printer', 'allergies', 'reports', 'PIN', 'checkout')..." : "Search family guides (e.g., 'check in', 'sanctuary pager', 'allergies', 'points', 'pickup')..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-13 rounded-2xl bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary transition-all font-medium text-sm shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold bg-muted px-2.5 py-1 rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ─── Clean Streamlined Navigation & Filters ───────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border/70 p-4 sm:p-5 rounded-2xl shadow-sm">
            {/* Role Filter Tabs - Only shown to privileged staff & administrators */}
            {isPrivileged ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline mr-1">
                  Filter by Role:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/50">
                  <Button
                    variant={selectedRole === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRole("all")}
                    className="rounded-lg font-bold text-xs h-8 px-3"
                  >
                    All Roles
                  </Button>
                  <Button
                    variant={selectedRole === "parent" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRole("parent")}
                    className="rounded-lg font-bold text-xs h-8 px-3"
                  >
                    Parents & Families
                  </Button>
                  <Button
                    variant={selectedRole === "staff" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRole("staff")}
                    className="rounded-lg font-bold text-xs h-8 px-3"
                  >
                    Staff & Teachers
                  </Button>
                  <Button
                    variant={selectedRole === "volunteer" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRole("volunteer")}
                    className="rounded-lg font-bold text-xs h-8 px-3"
                  >
                    Volunteers
                  </Button>
                  <Button
                    variant={selectedRole === "admin" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRole("admin")}
                    className="rounded-lg font-bold text-xs h-8 px-3"
                  >
                    Administrators
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold text-xs px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary border-primary/20">
                  Parents & Families Guides
                </Badge>
              </div>
            )}

            {/* Category Dropdown / Quick Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-xl bg-muted/50 border border-border/60 text-foreground font-semibold text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableCategories.map(category => (
                  <option key={category} value={category} className="bg-popover text-popover-foreground">
                    {category}
                  </option>
                ))}
              </select>

              {(selectedCategory !== "All Categories" || searchTerm || (isPrivileged && selectedRole !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(isPrivileged ? "all" : "parent");
                    setSelectedCategory("All Categories");
                    setSearchTerm("");
                  }}
                  className="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Chips / Status Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground">{filteredGuides.length}</strong> guides and <strong className="text-foreground">{filteredFaqs.length}</strong> FAQs
              {isPrivileged && selectedRole !== "all" && <span> for <strong className="text-primary capitalize">{selectedRole === "parent" ? "Parents & Families" : selectedRole === "staff" ? "Staff & Teachers" : selectedRole}</strong></span>}
              {selectedCategory !== "All Categories" && <span> in <strong className="text-primary">{selectedCategory}</strong></span>}
            </span>

            {searchTerm && (
              <span>
                Search query: <strong className="text-primary">"{searchTerm}"</strong>
              </span>
            )}
          </div>
        </div>

        {/* ─── Printable / Quick Reference Cheat Sheets ─────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-500" />
                {isPrivileged ? "Quick Printable Checklists & Cheat Sheets" : "Family Quick Checklists & Reference"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {isPrivileged ? "1-page quick reference protocols for Sunday morning operations." : "Quick-reference cards for Sunday check-in, sanctuary paging alerts, and safe pickup."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCheatSheets.map(sheet => {
              const SheetIcon = sheet.icon;
              return (
                <div
                  key={sheet.id}
                  className={`rounded-3xl border p-6 bg-gradient-to-br ${sheet.color} shadow-sm space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-black/30 shadow-sm">
                        <SheetIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight text-foreground">{sheet.title}</h4>
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">{sheet.targetRole}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs font-medium text-foreground/80">
                    {sheet.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Step-By-Step Interactive Guides Grid ──────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Interactive Step-By-Step Walkthroughs ({filteredGuides.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGuides.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-card rounded-3xl border border-dashed border-border/60">
                <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground">No Guides Match Your Search</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  Try searching for keywords like "check in", "print", "safety", "PIN", or reset your role and category filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setSelectedRole("all"); setSelectedCategory("All Categories"); }}
                  className="mt-4 rounded-xl font-bold"
                >
                  Reset Search & Filters
                </Button>
              </div>
            ) : (
              filteredGuides.map((guide) => {
                const IconComponent = guide.icon;
                const completedForGuide = completedSteps[guide.id] || [];
                const progressPercent = Math.round((completedForGuide.length / guide.steps.length) * 100);

                return (
                  <Card key={guide.id} className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all rounded-3xl bg-card flex flex-col justify-between">
                    <div>
                      <CardHeader className="p-6 pb-4 border-b bg-muted/10 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border ${guide.roleBadgeColor}`}>
                            {guide.roleBadge}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {guide.estimatedTime}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {guide.difficulty}
                            </Badge>
                          </div>
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

                        {completedForGuide.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                              <span>Progress</span>
                              <span>{progressPercent}% Complete</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5 rounded-full" />
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                          {guide.steps.map((step) => {
                            const isDone = completedForGuide.includes(step.number);
                            return (
                              <div
                                key={step.number}
                                onClick={() => toggleStepCompleted(guide.id, step.number)}
                                className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                                  isDone
                                    ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20"
                                    : "bg-muted/5 border-border/40 hover:bg-muted/15"
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-black text-xs transition-colors ${
                                    isDone
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "bg-primary/10 text-primary border border-primary/20"
                                  }`}
                                >
                                  {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
                                </button>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-bold leading-tight ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {step.title}
                                    </h4>
                                    {step.keyAction && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                                        {step.keyAction}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {step.description}
                                  </p>
                                  {step.tip && (
                                    <div className="mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-medium flex items-start gap-2">
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                      <span><strong className="font-bold">Pro Tip:</strong> {step.tip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-6 pt-0 border-t border-border/40 flex items-center justify-between gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenWalkthrough(guide)}
                        className="rounded-xl font-bold text-xs gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Guided Interactive View
                      </Button>

                      {guide.actionLink && (
                        <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 text-xs shadow-sm">
                          <Link to={guide.actionLink.url}>
                            {guide.actionLink.text}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Frequently Asked Questions (Accordion) ────────────────────── */}
        <div className="space-y-6 pt-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Frequently Asked Questions ({filteredFaqs.length})
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Quick answers to the most common questions across check-in, printing, safety, and attendance.
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
                <CollapsibleContent className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/5 font-medium space-y-3">
                  <p>{faq.answer}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roles:</span>
                      {faq.roles.map(r => (
                        <Badge key={r} variant="secondary" className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {r}
                        </Badge>
                      ))}
                    </div>

                    {!feedbackGiven[index] ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-muted-foreground mr-1">Helpful?</span>
                        <button
                          onClick={() => handleFeedback(index, true)}
                          className="p-1 rounded-md hover:bg-muted text-emerald-600 hover:text-emerald-700"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(index, false)}
                          className="p-1 rounded-md hover:bg-muted text-rose-500 hover:text-rose-600"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Feedback saved
                      </span>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* ─── Direct Support / Safety Hotline Card ──────────────────────── */}
        <Card className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-sm">
          {isPrivileged ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <LifeBuoy className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-foreground">Need Immediate On-Site Sunday Support?</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-xl">
                    If you experience printer hardware issues or require manual security overrides during Sunday service, notify the Lead Check-In Supervisor or Ministry Director immediately.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button asChild variant="outline" className="rounded-2xl font-bold h-12 px-5">
                  <Link to="/training">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Staff Training
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl font-bold h-12 px-5">
                  <Link to="/attendance">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Live Attendance
                  </Link>
                </Button>
                <Button asChild className="rounded-2xl font-bold h-12 px-5 shadow-md">
                  <Link to="/check-in">
                    <Monitor className="mr-2 h-4 w-4" />
                    Launch Kiosk
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <LifeBuoy className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-foreground">Need Family Support or Have Questions?</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-xl">
                    Our children's ministry team is here to help with child registration, allergy notes, pickup authorizations, or Sunday service schedules.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button asChild variant="outline" className="rounded-2xl font-bold h-12 px-6">
                  <Link to="/parent/profile">
                    <Users className="mr-2 h-4 w-4" />
                    View Family Profile & PIN
                  </Link>
                </Button>
                <Button asChild className="rounded-2xl font-bold h-12 px-6 shadow-md">
                  <Link to="/parent/messages">
                    <Mail className="mr-2 h-4 w-4" />
                    Message Ministry Leaders
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ─── Interactive Guided Walkthrough Modal ───────────────────────── */}
        {activeGuideModal && (
          <Dialog open={!!activeGuideModal} onOpenChange={(open) => !open && setActiveGuideModal(null)}>
            <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8">
              <DialogHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`font-bold text-xs px-3 py-1 rounded-full ${activeGuideModal.roleBadgeColor}`}>
                    {activeGuideModal.roleBadge}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">
                    Step {activeStepIndex + 1} of {activeGuideModal.steps.length}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                  {activeGuideModal.title}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium">
                  Follow this guided walkthrough to complete the workflow with zero guesswork.
                </DialogDescription>
              </DialogHeader>

              {/* Progress bar */}
              <div className="py-2">
                <Progress value={((activeStepIndex + 1) / activeGuideModal.steps.length) * 100} className="h-2 rounded-full" />
              </div>

              {/* Active Step Card */}
              <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 space-y-4 my-2">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                    {activeGuideModal.steps[activeStepIndex].number}
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-base font-black text-foreground leading-tight">
                      {activeGuideModal.steps[activeStepIndex].title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                      {activeGuideModal.steps[activeStepIndex].description}
                    </p>
                  </div>
                </div>

                {activeGuideModal.steps[activeStepIndex].tip && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="font-bold">Pro Tip:</strong> {activeGuideModal.steps[activeStepIndex].tip}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))}
                  className="rounded-xl font-bold"
                >
                  Previous Step
                </Button>

                <div className="flex items-center gap-2">
                  {activeGuideModal.actionLink && (
                    <Button asChild variant="secondary" className="rounded-xl font-bold">
                      <Link to={activeGuideModal.actionLink.url}>
                        {activeGuideModal.actionLink.text}
                      </Link>
                    </Button>
                  )}

                  {activeStepIndex < activeGuideModal.steps.length - 1 ? (
                    <Button
                      onClick={() => setActiveStepIndex(i => Math.min(activeGuideModal.steps.length - 1, i + 1))}
                      className="rounded-xl font-bold"
                    >
                      Next Step
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        toast({ title: "Walkthrough Complete!", description: "You have mastered this workflow." });
                        setActiveGuideModal(null);
                      }}
                      className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Finish Walkthrough
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </ModernLayout>
  );
};

export default HelpDocumentation;
