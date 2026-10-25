import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileText, ArrowLeft, Mail, CheckCircle2, UserCheck, HeartHandshake } from "lucide-react";

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="h-4 w-4 text-emerald-600" /> COPPA Compliant Privacy Notice
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 pb-6 border-b border-border/50">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Privacy Policy & Child Safety Statement
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            KiddoChecker Childcare Check-In System — Protecting family privacy, attendance, and emergency medical records.
          </p>
          <p className="text-xs text-muted-foreground">
            Effective Date: October 24, 2026 | Last Updated: October 2026
          </p>
        </div>

        {/* Overview Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              1. Our Commitment to Children's Privacy (COPPA Compliance)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              KiddoChecker ("we", "us", "our") provides child check-in, presence tracking, and classroom safety services for churches and childcare facilities. We recognize the utmost importance of safeguarding the personal information of minors under the Children’s Online Privacy Protection Act (COPPA).
            </p>
            <p>
              <strong>We do not collect personal information directly from children.</strong> All account creation, profile management, and child record submissions are performed exclusively by parents, legal guardians, or authorized organization administrators.
            </p>
          </CardContent>
        </Card>

        {/* Information Collected */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-indigo-600" />
              2. Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h4 className="font-semibold text-foreground text-sm">A. Parent & Guardian Information:</h4>
              <p className="mt-1">
                Parent full name, email address, mobile phone number, home address, account security credentials (hashed passwords, 4-6 digit kiosk PIN), and relationship to child.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">B. Child Enrollment Information:</h4>
              <p className="mt-1">
                Child first and last name, date of birth (for age-appropriate classroom placement), and assigned care groups.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">C. Medical, Dietary, & Emergency Details:</h4>
              <p className="mt-1">
                Severe and mild allergies (e.g. peanuts, dairy, penicillin), medical conditions (e.g. asthma, diabetes), emergency care instructions, primary care physician contact, and emergency contact details. Insurance details are optional and collected solely for emergency treatment coordination.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">D. Attendance & Authorized Pickup Records:</h4>
              <p className="mt-1">
                Live check-in and check-out timestamps, matching claim-ticket tokens, and designated authorized pickup individuals with contact verification.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Purpose & Use */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <HeartHandshake className="h-5 w-5 text-indigo-600" />
              3. How We Use Collected Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-1">
              <li>Facilitating fast, touchless QR code and PIN-based child check-in and claim-ticket verification.</li>
              <li>Alerting classroom volunteers and teachers to life-threatening allergies or immediate health needs.</li>
              <li>Ensuring only verified, authorized individuals can pick up a child.</li>
              <li>Sending emergency text or email notifications regarding child welfare during events.</li>
              <li>Meeting regulatory and church safety standards for child-to-staff classroom ratios.</li>
            </ul>
            <p className="pt-2 text-xs text-foreground font-semibold">
              We never sell, rent, or monetize child or family data. We do not use child profiles for commercial advertising.
            </p>
          </CardContent>
        </Card>

        {/* Data Security & Infrastructure */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5 text-indigo-600" />
              4. Data Protection & Cloud Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              KiddoChecker is hosted on <strong>Microsoft Azure Cloud Infrastructure</strong> utilizing industry-standard security safeguards:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Encryption in Transit:</strong> All data transmissions are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).</li>
              <li><strong>Encryption at Rest:</strong> Child records, medical profiles, and attendance tables are encrypted at rest using AES-256 standards in Azure PostgreSQL.</li>
              <li><strong>Strict Role Isolation:</strong> Parents can only view their own registered children. Volunteers and staff cannot view records outside their authorized role.</li>
              <li><strong>Credential Security:</strong> Passwords are encrypted using bcrypt salted hashes. Kiosk PINs are masked and protected against automated brute-force attacks.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Retention & Parental Rights */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              5. Parental Rights: Access, Correction, and Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Parents have complete control over their family records. At any time, you may:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Log into the Parent Portal to review, update, or edit your child's medical alerts and emergency contacts.</li>
              <li>Request immediate deletion of your child's profile and historical attendance logs.</li>
              <li>Revoke consent for optional data collection.</li>
            </ul>
            <p className="pt-2">
              To request account deletion or data review, contact your church administrator or email our safety team at{" "}
              <a href="mailto:privacy@gvachurch.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                privacy@gvachurch.com
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
          <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto" />
          <h3 className="font-bold text-base text-foreground">Questions or Concerns?</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Green Valley Alliance Church Child Safety & Security Team
            <br />
            Email: <a href="mailto:privacy@gvachurch.com" className="font-semibold text-indigo-600 dark:text-indigo-400">privacy@gvachurch.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
