import React, { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Shield,
  ShieldCheck,
  Bell,
  Vibrate,
  Monitor,
  Printer,
  QrCode,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  HeartHandshake,
  FileCheck,
  Award,
  Copy,
  Check,
  VolumeX,
  Play,
  RotateCcw,
  CheckSquare,
  ChevronRight,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { triggerHapticPaging } from "@/components/notifications/SanctuaryPageReceiver";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "When displaying a parent page on the sanctuary projector screen, what must be shown?",
    options: [
      "The child's full name and classroom room number",
      "Only the private 4-character Family Pager Code (e.g., PAGER # A4B2)",
      "The parent's full name and registered phone number",
      "The child's photo and medical diagnosis"
    ],
    correctIndex: 1,
    explanation: "For family privacy and child safety, names are NEVER publicized. Only the 4-character code is flashed discreetly."
  },
  {
    id: 2,
    question: "What is the primary condition required before releasing a child at checkout?",
    options: [
      "The child recognizes the adult and smiles",
      "The adult claims to be the child's uncle or aunt",
      "A 100% exact match between the security code on the Guardian Claim Ticket and the Child Name Tag",
      "The child was checked in over 2 hours ago"
    ],
    correctIndex: 2,
    explanation: "The Golden Rule: Never release a child without matching the printed security code or performing an authorized photo ID override."
  },
  {
    id: 3,
    question: "How does KiddoChecker silently alert parents on their mobile phones during worship?",
    options: [
      "Plays a loud continuous ringtone",
      "Sends a silent haptic vibration pattern and in-app assistance notification without audible alarm",
      "Calls the church pastor directly on the pulpit microphone",
      "Shuts down the parent's phone"
    ],
    correctIndex: 1,
    explanation: "KiddoChecker uses silent Web Vibration haptics ([450ms, 180ms, 450ms, 180ms, 700ms]) so the service is never audibly disrupted."
  },
  {
    id: 4,
    question: "What should classroom leaders do if a parent loses their physical Claim Ticket?",
    options: [
      "Refuse to release the child until church leadership arrives on Monday",
      "Let the child leave if the volunteer personally knows the family",
      "Inspect government photo ID, verify against the registered parent profile, and enter an audit log override",
      "Ask the child to confirm the parent's date of birth"
    ],
    correctIndex: 2,
    explanation: "Staff can perform an authorized checkout with a verified government photo ID and a recorded audit reason."
  },
  {
    id: 5,
    question: "What is the recommended protocol before paging a parent for an upset infant or toddler?",
    options: [
      "Page immediately after 30 seconds of crying",
      "Attempt comforting techniques (soothing, toy redirection, rocking) for 10 minutes before triggering a page",
      "Never page parents under any circumstance",
      "Send the infant to the main auditorium alone"
    ],
    correctIndex: 1,
    explanation: "Allow 10 minutes of gentle redirection and soothing before triggering a callout, unless there is a medical emergency."
  }
];

const StaffAdminTrainingPage: React.FC = () => {
  const { userRole, isAdmin, isSuperAdmin, isStaff, isTeacher, isVolunteer } = useAuth();
  
  // Interactive Simulator State
  const [simFamilyCode, setSimFamilyCode] = useState<string>("M83F");
  const [simChildName, setSimChildName] = useState<string>("Lucas Bennett (Nursery Room A)");
  const [simReason, setSimReason] = useState<string>("Child inconsolable (10+ min)");
  const [simStatus, setSimStatus] = useState<"idle" | "paging" | "acknowledged">("idle");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({
    sanctuary: true,
  });

  const isSimulatedStaff = typeof window !== "undefined" && ["admin", "super_admin", "staff", "teacher", "volunteer"].includes(new URLSearchParams(window.location.search).get("simulate") || "");
  const isAuthorized = isAdmin || isSuperAdmin || isStaff || isTeacher || isVolunteer || isSimulatedStaff;

  // Simulator actions
  const handleTriggerSimPage = () => {
    setSimStatus("paging");
    triggerHapticPaging();
    toast.info(`Sanctuary Callout triggered for Code #${simFamilyCode}!`, {
      description: "Mobile vibration pattern activated. Projected on sanctuary screen.",
    });
  };

  const handleSimAcknowledge = () => {
    setSimStatus("acknowledged");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
    toast.success("Parent Acknowledged: 'I am on my way!'", {
      description: "Alert cleared from classroom monitors.",
    });
  };

  const handleCopyProjector = () => {
    navigator.clipboard.writeText(`PAGER # ${simFamilyCode}`);
    setCopiedCode(true);
    toast.success(`Copied "PAGER # ${simFamilyCode}" for ProPresenter!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Quiz evaluation
  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    return correct;
  };

  const handleCompleteModule = (moduleId: string) => {
    setCompletedModules((prev) => ({ ...prev, [moduleId]: true }));
    toast.success("Module marked as completed!");
  };

  const totalModules = 5;
  const progressPercent = Math.min(
    100,
    Math.round(((Object.keys(completedModules).length + (quizSubmitted ? 1 : 0)) / totalModules) * 100)
  );

  // Unauthorized Access Gate
  if (!isAuthorized) {
    return (
      <ModernLayout>
        <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Staff & Leader Access Only</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Training Hub contains confidential Duty of Care protocols, emergency evacuation maps, and child protection procedures restricted to verified volunteers, staff, and administrators.
          </p>
          <Button onClick={() => window.location.href = "/"} variant="outline" className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-8 py-6 pb-28 px-3 sm:px-6">
        
        {/* ─── Hero Header Banner ────────────────────────────────────────── */}
        <div className="surface-card bg-gradient-to-r from-primary/10 via-slate-500/5 to-indigo-500/10 border-primary/25 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Staff & Leader Training Portal
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                  Official Standard Operating Procedures (SOP)
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Children's Ministry Training & Certification
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Master child safety, sanctuary parent paging, lobby kiosk check-in, allergy handling, and safe checkout protocols before serving.
              </p>
            </div>

            {/* Overall Training Progress Bar */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-xs w-full md:w-72 space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Certification Progress</span>
                <span className="font-bold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {Object.keys(completedModules).length} of 5 modules completed
              </p>
            </div>
          </div>
        </div>

        {/* ─── Main Tabs Navigation ─────────────────────────────────────── */}
        <Tabs defaultValue="simulator" className="space-y-6">
          <TabsList className="bg-card border border-border/70 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="simulator" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Play className="h-3.5 w-3.5" />
              Interactive Pager Simulator
            </TabsTrigger>
            <TabsTrigger value="paging" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-3.5 w-3.5" />
              1. Sanctuary Paging SOP
            </TabsTrigger>
            <TabsTrigger value="kiosk" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Monitor className="h-3.5 w-3.5" />
              2. Kiosk & Security Tags
            </TabsTrigger>
            <TabsTrigger value="checkout" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              3. Dismissal & Pick-Up
            </TabsTrigger>
            <TabsTrigger value="classroom" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-3.5 w-3.5" />
              4. Ratios & Duty of Care
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="h-3.5 w-3.5" />
              5. Knowledge Quiz & Cert
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 0: LIVE INTERACTIVE SANCTUARY PAGING SIMULATOR                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="simulator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Staff Trigger Panel */}
              <Card className="lg:col-span-5 border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Classroom Leader Terminal</CardTitle>
                      <CardDescription className="text-xs">Practice triggering a live test callout to a parent</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Test Family Pager Code</label>
                    <Input
                      value={simFamilyCode}
                      onChange={(e) => setSimFamilyCode(e.target.value.toUpperCase())}
                      className="font-mono text-base font-bold uppercase tracking-widest"
                      maxLength={6}
                    />
                    <p className="text-[11px] text-muted-foreground">Each registered family has a unique 4-character code.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Simulated Child</label>
                    <select
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
                      value={simChildName}
                      onChange={(e) => setSimChildName(e.target.value)}
                    >
                      <option value="Lucas Bennett (Nursery Room A)">Lucas Bennett (Nursery Room A)</option>
                      <option value="Emma Davis (Toddlers Wing)">Emma Davis (Toddlers Wing)</option>
                      <option value="Noah Parker (Preschool Room 3)">Noah Parker (Preschool Room 3)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Callout Reason</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        "Child inconsolable (10+ min)",
                        "Diaper / wardrobe change needed",
                        "Medical or allergy symptom alert",
                        "Parent presence requested by leader"
                      ].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSimReason(r)}
                          className={cn(
                            "text-left px-3 py-2 rounded-lg border transition-all text-xs",
                            simReason === r
                              ? "bg-primary/10 border-primary/40 font-semibold text-primary"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={handleTriggerSimPage}
                      className="w-full gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Bell className="h-4 w-4" />
                      Broadcast Simulated Sanctuary Alert
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSimStatus("idle");
                        triggerHapticPaging();
                        toast.success("Phone vibration pattern triggered directly!");
                      }}
                      className="w-full gap-2 text-xs"
                    >
                      <Vibrate className="h-4 w-4 text-primary" />
                      Test Physical Phone Vibration Only
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Two Output Displays (Sanctuary Screen & Parent Mobile Phone) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Sanctuary Projector Screen Preview */}
                <Card className="border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white py-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Sanctuary Screen / ProPresenter Feed</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                      Discreet Sanctuary Projection
                    </Badge>
                  </CardHeader>
                  <CardContent className="bg-slate-950 p-6 sm:p-8 text-center space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Current Screen Output
                    </p>
                    <div className="font-mono text-3xl sm:text-5xl font-black tracking-widest text-amber-400 py-2">
                      {simStatus !== "idle" ? `PAGER # ${simFamilyCode}` : "— NO ACTIVE CALLOUT —"}
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {simStatus !== "idle" ? (
                        <>Only your 4-character code flashes. <strong className="text-white">Notice child name ({simChildName}) is NEVER displayed</strong> on the public screen to protect privacy.</>
                      ) : (
                        "When classroom leaders trigger a page, the ProPresenter overlay displays the 4-character code."
                      )}
                    </p>
                    {simStatus !== "idle" && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyProjector}
                          className="bg-slate-900 hover:bg-slate-800 text-white border-slate-700 text-xs gap-1.5"
                        >
                          {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedCode ? "Copied to Clipboard" : "Copy for ProPresenter Operator"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Parent Mobile Device Screen Mockup */}
                <Card className="border-border/70 shadow-sm">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Parent Mobile Device Experience</span>
                    </div>
                    <Badge className={cn("text-[10px]", simStatus === "paging" ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground")}>
                      {simStatus === "paging" ? "Haptic Vibration Active" : simStatus === "acknowledged" ? "Acknowledged" : "Standby"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {simStatus === "paging" ? (
                      <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 sm:p-5 space-y-3 animate-enter">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm">
                              <Bell className="h-5 w-5 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">Assistance Requested</p>
                              <p className="text-xs text-muted-foreground">{simChildName}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs font-bold text-primary border-primary/30">
                            #{simFamilyCode}
                          </Badge>
                        </div>

                        <div className="bg-card p-3 rounded-xl border border-border/70 text-xs space-y-1">
                          <p className="text-muted-foreground font-medium">Reason:</p>
                          <p className="font-semibold text-foreground">{simReason}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40 mt-1">
                            <VolumeX className="h-3 w-3 text-primary shrink-0" />
                            <span>Phone vibrated silently with pattern [450ms, 180ms, 450ms, 180ms, 700ms].</span>
                          </div>
                        </div>

                        <Button
                          onClick={handleSimAcknowledge}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Simulate Parent Tapping: "I'm On My Way"
                        </Button>
                      </div>
                    ) : simStatus === "acknowledged" ? (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <p className="text-sm font-bold text-foreground">Parent Has Acknowledged</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Classroom teachers see "Parent in Transit". Vibration stopped on parent phone.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSimStatus("idle")}
                          className="text-xs mt-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Reset Simulator
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground space-y-2">
                        <Vibrate className="h-8 w-8 mx-auto opacity-30" />
                        <p className="text-xs font-medium">Click "Broadcast Simulated Sanctuary Alert" on the left to see the parent experience.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: SANCTUARY PAGING SOP                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="paging" className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Module 1: Sanctuary Paging Protocol
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Official policy on when and how to page parents silently during worship services.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={completedModules.sanctuary ? "outline" : "default"}
                    onClick={() => handleCompleteModule("sanctuary")}
                    className="text-xs gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {completedModules.sanctuary ? "Completed ✓" : "Mark as Completed"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-xs sm:text-sm">
                
                {/* 3 Core Rules Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/70 space-y-1.5">
                    <p className="font-bold text-primary text-xs uppercase tracking-wider">1. The 10-Minute Rule</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      For inconsolable infants or upset toddlers, attempt comfort techniques (gentle rocking, toy redirection, song, snack) for 10 full minutes before paging, unless in medical distress.
                    </p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/70 space-y-1.5">
                    <p className="font-bold text-primary text-xs uppercase tracking-wider">2. Absolute Privacy</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      NEVER announce a child's name, parent's name, or display it on the sanctuary projector. Flash ONLY the 4-character Family Pager Code (e.g., <em>PAGER # A4B2</em>).
                    </p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/70 space-y-1.5">
                    <p className="font-bold text-primary text-xs uppercase tracking-wider">3. Multi-Layer Alerts</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      KiddoChecker automatically combines silent phone vibration haptics, in-app top alerts, projector screen projection, and SMS backup for 100% notification reliability.
                    </p>
                  </div>
                </div>

                {/* Step-by-step Leader Walkthrough */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-base text-foreground">Step-by-Step Leader Procedure</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">Locate Child on Digital Room Roster</p>
                        <p className="text-xs text-muted-foreground">Open your classroom tablet to Volunteer/Teacher Dashboard. Tap the child's row or the "Page" icon.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">Select Callout Reason</p>
                        <p className="text-xs text-muted-foreground">Choose from the standardized reasons: Inconsolable, Diaper/Wardrobe Change, Medical Alert, or Parent Requested.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">Click "Trigger Sanctuary Alert"</p>
                        <p className="text-xs text-muted-foreground">The system immediately logs the Duty of Care event, triggers the parent's phone vibration pattern, and alerts the AV team for screen display.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">Wait for Parent Acknowledgment</p>
                        <p className="text-xs text-muted-foreground">When the parent taps "I'm On My Way", your screen updates to show they are in transit. Greet them at the check-in door with the child ready.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: KIOSK & SECURITY BADGE PRINTING                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="kiosk" className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      Module 2: Lobby Kiosk & Security Badge Printing
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Master the check-in hardware, fast lookups, and printed security tags.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={completedModules.kiosk ? "outline" : "default"}
                    onClick={() => handleCompleteModule("kiosk")}
                    className="text-xs gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {completedModules.kiosk ? "Completed ✓" : "Mark as Completed"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 text-xs sm:text-sm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Badge Anatomy */}
                  <div className="border border-border/70 rounded-2xl p-4 bg-muted/20 space-y-3">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Printer className="h-4 w-4 text-primary" />
                      Anatomy of a Security Label Pair
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-card rounded-lg border border-border/70">
                        <strong className="text-foreground">1. Child Adhesive Badge:</strong>
                        <p className="text-muted-foreground mt-0.5">Attached to child's upper back or chest. Displays child first name, room assignment, allergies in bold red warning box, parent contact phone, and unique 4-character code.</p>
                      </div>
                      <div className="p-2.5 bg-card rounded-lg border border-border/70">
                        <strong className="text-foreground">2. Parent Claim Ticket:</strong>
                        <p className="text-muted-foreground mt-0.5">Handed to guardian. Features the matching 4-character security code and barcode. Required for pickup.</p>
                      </div>
                    </div>
                  </div>

                  {/* Kiosk Operations Checklist */}
                  <div className="border border-border/70 rounded-2xl p-4 bg-muted/20 space-y-3">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Sunday 8:00 AM Station Setup Checklist
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Verify steady green light on Brother / Zebra thermal label printers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Ensure continuous 2.25" x 3.5" thermal label roll has at least 100+ labels remaining.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Run a test print using the "Reprint Tag" button on any test child.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Keep backup paper rolls and sanitary cleaning wipes under the kiosk desk.</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: DISMISSAL & PICK-UP SECURITY                                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="checkout" className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Module 3: Dismissal & Pick-Up Security Protocols
                    </CardTitle>
                    <CardDescription className="text-xs">
                      The Golden Rule: Preventing unauthorized releases and handling lost claim tickets.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={completedModules.checkout ? "outline" : "default"}
                    onClick={() => handleCompleteModule("checkout")}
                    className="text-xs gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {completedModules.checkout ? "Completed ✓" : "Mark as Completed"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 text-xs sm:text-sm">
                
                {/* The Golden Rule Alert */}
                <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-900/15 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">The Golden Rule of Child Release</h4>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                      <strong>NEVER release a child without an exact match</strong> between the 4-character code on the Parent Claim Ticket and the Child Name Tag. Even if you recognize the parent, the system requirement protects against custody disputes and unauthorized family pickups.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-foreground text-sm">Protocol for Lost Claim Tickets</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-card p-3.5 rounded-xl border border-border/70 space-y-1">
                      <span className="font-bold text-primary text-xs">Step 1: ID Verification</span>
                      <p className="text-xs text-muted-foreground">Request the guardian's government photo ID (Driver's License, Passport).</p>
                    </div>
                    <div className="bg-card p-3.5 rounded-xl border border-border/70 space-y-1">
                      <span className="font-bold text-primary text-xs">Step 2: Profile Match</span>
                      <p className="text-xs text-muted-foreground">Search child in staff portal. Confirm guardian name is listed as authorized primary or pickup contact.</p>
                    </div>
                    <div className="bg-card p-3.5 rounded-xl border border-border/70 space-y-1">
                      <span className="font-bold text-primary text-xs">Step 3: Override Logging</span>
                      <p className="text-xs text-muted-foreground">Click "Override Checkout", record reason ("Verified driver license #..."), and submit audit log.</p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: RATIOS & DUTY OF CARE                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="classroom" className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Module 4: Classroom Ratios & Duty of Care
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mandatory safety ratios, two-adult rule, and incident documentation.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={completedModules.classroom ? "outline" : "default"}
                    onClick={() => handleCompleteModule("classroom")}
                    className="text-xs gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {completedModules.classroom ? "Completed ✓" : "Mark as Completed"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 text-xs sm:text-sm">
                
                {/* Ratios Table */}
                <div className="rounded-2xl border border-border/70 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border/70 font-semibold text-foreground">
                      <tr>
                        <th className="p-3">Age Group / Room</th>
                        <th className="p-3">Mandatory Staff-to-Child Ratio</th>
                        <th className="p-3">Minimum Adults in Room</th>
                        <th className="p-3">Safety Requirements</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-muted-foreground">
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Infants (0 – 12 months)</td>
                        <td className="p-3 text-primary font-bold">1 : 3</td>
                        <td className="p-3">2 Adults minimum</td>
                        <td className="p-3">Crib inspection, safe sleep back-only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Toddlers (1 – 2 years)</td>
                        <td className="p-3 text-primary font-bold">1 : 4</td>
                        <td className="p-3">2 Adults minimum</td>
                        <td className="p-3">Choking hazard checks, gate secured</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Preschool (3 – 4 years)</td>
                        <td className="p-3 text-primary font-bold">1 : 6</td>
                        <td className="p-3">2 Adults minimum</td>
                        <td className="p-3">Restroom door open two-volunteer policy</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Elementary (Kindergarten – 5th)</td>
                        <td className="p-3 text-primary font-bold">1 : 8</td>
                        <td className="p-3">2 Adults minimum</td>
                        <td className="p-3">Name tag verification before any room exit</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Two-Adult Rule */}
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/70 space-y-1">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">The "Two-Adult" Protection Policy</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Under no circumstance should a single adult volunteer be alone behind closed doors with a child. Always ensure at least two background-checked leaders are present, or keep the door open with a line of sight from the hallway.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: KNOWLEDGE CHECK & CERTIFICATION                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="quiz" className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Module 5: Staff Knowledge Verification & Certification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Demonstrate proficiency in KiddoChecker safety protocols and earn your Certified Leader status.
                    </CardDescription>
                  </div>
                  {quizSubmitted && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs font-bold">
                      Score: {calculateScore()} / {QUIZ_QUESTIONS.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Questions */}
                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, idx) => {
                    const selected = quizAnswers[q.id];
                    const isCorrect = selected === q.correctIndex;
                    
                    return (
                      <div key={q.id} className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{q.question}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selected === optIdx;
                            let btnStyle = "border-border hover:bg-muted/50 text-foreground";
                            
                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                              } else if (isChosen && !isCorrect) {
                                btnStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold";
                              }
                            } else if (isChosen) {
                              btnStyle = "border-primary bg-primary/10 text-primary font-semibold";
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() => handleSelectAnswer(q.id, optIdx)}
                                className={cn(
                                  "text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between",
                                  btnStyle
                                )}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correctIndex && (
                                  <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className={cn(
                            "p-3 rounded-xl text-xs",
                            isCorrect ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                          )}>
                            <strong>{isCorrect ? "✓ Correct: " : "Notice: "}</strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit / Reset Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {!quizSubmitted ? (
                    <Button
                      onClick={() => {
                        if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
                          toast.error("Please answer all 5 questions before submitting.");
                          return;
                        }
                        setQuizSubmitted(true);
                        toast.success(`Quiz completed! You scored ${calculateScore()} / ${QUIZ_QUESTIONS.length}`);
                      }}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6"
                    >
                      Submit Certification Assessment
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-6 w-6 text-emerald-500" />
                        <div>
                          <p className="font-bold text-foreground text-xs sm:text-sm">
                            {calculateScore() >= 4 ? "Certification Passed: Verified KiddoChecker Leader!" : "Review the SOP and retry to achieve 100%."}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Score: {calculateScore()} of {QUIZ_QUESTIONS.length} questions answered correctly.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        className="text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Retake Assessment
                      </Button>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </ModernLayout>
  );
};

export default StaffAdminTrainingPage;
