
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
        
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using the KidCheck application and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Use License</h2>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily use the KidCheck application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained in the KidCheck application</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by KidCheck at any time.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To use certain features of the KidCheck application, you must register for an account. You must provide accurate and complete information and keep your account information updated. You are responsible for maintaining the security of your account and password. KidCheck cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">User Content</h2>
            <p className="text-gray-700 mb-4">
              KidCheck does not claim ownership of any content that you post, upload, or submit to the service. However, by posting, uploading, or submitting content to the service, you grant KidCheck a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in connection with providing the service to you and other users.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              The materials on KidCheck's application are provided on an 'as is' basis. KidCheck makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Limitations</h2>
            <p className="text-gray-700 mb-4">
              In no event shall KidCheck or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on KidCheck's application, even if KidCheck or a KidCheck authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
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

export default TermsOfService;
