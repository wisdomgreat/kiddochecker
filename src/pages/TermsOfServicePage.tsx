import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileCheck, ArrowLeft, Mail, AlertCircle, Users, CheckCircle2 } from "lucide-react";

export const TermsOfServicePage = () => {
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
            <Shield className="h-4 w-4 text-indigo-600" /> Platform Agreement
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 pb-6 border-b border-border/50">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            KiddoChecker Child Check-In & Safety Management System — Rules, Responsibilities, and Safety Policies.
          </p>
          <p className="text-xs text-muted-foreground">
            Effective Date: October 24, 2026 | Last Updated: October 2026
          </p>
        </div>

        {/* Acceptance */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              1. Acceptance of Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              By accessing or using KiddoChecker ("the Service"), registering an account, or registering children for organization events, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not use the platform.
            </p>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-indigo-600" />
              2. User & Parent Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Accurate Information:</strong> You agree to provide accurate and truthful child information, including emergency contacts and critical medical/allergy conditions.</li>
              <li><strong>Credential Security:</strong> You are responsible for keeping your password and 4-6 digit Kiosk PIN confidential. Do not share your PIN with unauthorized individuals.</li>
              <li><strong>Authorized Pickups:</strong> You agree to designate authorized pickup individuals. Our staff will not release children to individuals not listed as authorized guardians or carrying a matching claim ticket.</li>
              <li><strong>Health Screening:</strong> Parents agree to adhere to illness policies and refrain from checking in children presenting contagious symptoms (fever, persistent cough).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Safety & Check-In Protocol */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-indigo-600" />
              3. Check-In & Child Release Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              To ensure maximum protection for all children:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each check-in produces a printed or digital Child Name Tag with unique identifier and a corresponding Parent Claim Ticket.</li>
              <li>Children will only be released to an individual presenting the verified matching Claim Ticket or confirmed government ID matching an authorized pickup profile.</li>
              <li>Staff members reserve the right to verify identity whenever safety requires.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              4. Service Availability & Emergency Medical Care
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              In the event of a medical emergency during care, organization staff will attempt to contact emergency contacts immediately. If life-saving treatment is urgent, staff and emergency personnel are authorized to provide necessary care according to standard Good Samaritan and emergency protocols.
            </p>
            <p>
              The Service is provided on an "as-is" and "as-available" basis on Microsoft Azure Cloud infrastructure. We employ continuous monitoring and backups, but are not liable for external network outages beyond our reasonable control.
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              5. Changes to Terms & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              We reserve the right to update these terms to reflect changes in safety regulations or software capabilities. Notice of updates will be posted on this page.
            </p>
            <p>
              For legal inquiries regarding these terms, contact us at:{" "}
              <a href="mailto:admin@gvachurch.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                admin@gvachurch.com
              </a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
