
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/landing")}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-700 mb-4">
              KidCheck ("we", "our", or "us") is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our KidCheck application and services.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information that you provide directly to us when registering for an account, setting up profiles for children, using the check-in/check-out features, and interacting with our application.
            </p>
            
            <h3 className="text-lg font-medium mb-2 mt-4">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Contact information (name, email address, phone number)</li>
              <li>Account credentials</li>
              <li>Child information (name, age, allergies, special instructions)</li>
              <li>Emergency contact information</li>
              <li>Attendance records and check-in/check-out data</li>
              <li>Photos for identification purposes (when provided)</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">Automatically Collected Information</h3>
            <p className="text-gray-700 mb-4">
              When you access our application, we may automatically collect certain information, including:
            </p>
            
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Device information (type, operating system, browser)</li>
              <li>Log data (IP address, access times, activities)</li>
              <li>Usage patterns and preferences</li>
            </ul>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for various purposes, including:
            </p>
            
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Providing and maintaining our services</li>
              <li>Processing and completing check-in/check-out requests</li>
              <li>Managing user accounts and preferences</li>
              <li>Sending notifications and service-related communications</li>
              <li>Improving and customizing our application</li>
              <li>Ensuring the security and integrity of our services</li>
              <li>Analyzing usage patterns and trends</li>
              <li>Complying with legal obligations</li>
            </ul>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-8">Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-8">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>

            <p className="text-gray-500 mt-8">
              Last Updated: May 7, 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
