
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SearchForm, { CheckoutItem } from "@/components/check-out/SearchForm";
import CheckoutTable from "@/components/check-out/CheckoutTable";
import QrCodeScanner from "@/components/check-out/QrCodeScanner";
import PhoneNumberForm from "@/components/check-in/PhoneNumberForm";
import ChildRegistrationForm from "@/components/check-in/ChildRegistrationForm";
import ClassSelectionForm from "@/components/check-in/ClassSelectionForm";
import NameTagPrinter from "@/components/check-in/NameTagPrinter";
import QRCodeGenerator from "@/components/check-in/QRCodeGenerator";
import { 
  CalendarCheck, 
  CalendarOff, 
  Search, 
  QrCode, 
  Phone, 
  Users, 
  GraduationCap,
  Tag,
  Printer,
  LogIn,
  LogOut
} from "lucide-react";

const CheckInOutManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check-out state
  const [checkoutResults, setCheckoutResults] = useState<CheckoutItem[]>([]);
  const [activeCheckoutTab, setActiveCheckoutTab] = useState<string>("search");
  
  // Check-in state
  const [activeCheckInStep, setActiveCheckInStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [childData, setChildData] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  
  // Handle QR code scanning for checkout
  const handleScanComplete = (attendanceId: string) => {
    console.log("QR Code scanned:", attendanceId);
    toast({
      title: "QR Code Scanned",
      description: `Processing attendance ID: ${attendanceId}`,
    });
  };
  
  // Handle check-in navigation
  const handleNextCheckInStep = (step: string, data?: any) => {
    if (step === "child" && data) {
      setChildData(data);
    }
    if (step === "class" && data) {
      setClassData(data);
    }
    setActiveCheckInStep(step);
  };
  
  // Handle print completion
  const handlePrintComplete = () => {
    toast({
      title: "Print Complete",
      description: "Name tag has been printed successfully",
    });
    // Reset the check-in process
    setActiveCheckInStep("phone");
    setPhoneNumber("");
    setChildData(null);
    setClassData(null);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Check-In & Check-Out</h1>
          <p className="text-gray-500">Manage children arrivals and departures</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/check-in-kiosk")}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Open Check-in Kiosk
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/check-out-station")}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Open Check-out Station
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="check-in" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in" className="flex items-center">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Check-In Process
          </TabsTrigger>
          <TabsTrigger value="check-out" className="flex items-center">
            <CalendarOff className="mr-2 h-4 w-4" />
            Check-Out Process
          </TabsTrigger>
        </TabsList>

        {/* Check-In Tab Content */}
        <TabsContent value="check-in">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left column - Check-in process */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Child Check-In</CardTitle>
                  <CardDescription>
                    Process for checking in children
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Step indicators */}
                    <div className="flex justify-between relative">
                      {["phone", "child", "class", "print"].map((step, idx) => (
                        <div key={step} className="flex flex-col items-center z-10 relative">
                          <div 
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              activeCheckInStep === step 
                                ? "bg-purple-600 text-white"
                                : idx < ["phone", "child", "class", "print"].indexOf(activeCheckInStep)
                                  ? "bg-green-100 text-green-600 border-2 border-green-600"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {step === "phone" && <Phone className="h-5 w-5" />}
                            {step === "child" && <Users className="h-5 w-5" />}
                            {step === "class" && <GraduationCap className="h-5 w-5" />}
                            {step === "print" && <Printer className="h-5 w-5" />}
                          </div>
                          <span className={`text-xs mt-2 font-medium ${
                            activeCheckInStep === step ? "text-purple-600" : "text-gray-500"
                          }`}>
                            {step === "phone" && "Phone"}
                            {step === "child" && "Child"}
                            {step === "class" && "Class"}
                            {step === "print" && "Print"}
                          </span>
                        </div>
                      ))}
                      
                      {/* Connecting line */}
                      <div className="absolute top-5 h-0.5 bg-gray-200 w-full -z-0"></div>
                    </div>

                    {/* Step content */}
                    {activeCheckInStep === "phone" && (
                      <div className="py-4">
                        <h3 className="text-lg font-medium mb-4">Enter Phone Number</h3>
                        <PhoneNumberForm 
                          phoneNumber={phoneNumber}
                          onChange={setPhoneNumber}
                        />
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={() => handleNextCheckInStep("child")}
                            disabled={!phoneNumber || phoneNumber.length < 10}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {activeCheckInStep === "child" && (
                      <div className="py-4">
                        <h3 className="text-lg font-medium mb-4">Select Child</h3>
                        <ChildRegistrationForm 
                          onComplete={(data) => handleNextCheckInStep("class", data)}
                          onBack={() => setActiveCheckInStep("phone")}
                        />
                      </div>
                    )}
                    
                    {activeCheckInStep === "class" && (
                      <div className="py-4">
                        <h3 className="text-lg font-medium mb-4">Select Class</h3>
                        {childData && (
                          <ClassSelectionForm 
                            onComplete={(data) => handleNextCheckInStep("print", data)} 
                            onBack={() => setActiveCheckInStep("child")}
                          />
                        )}
                      </div>
                    )}
                    
                    {activeCheckInStep === "print" && (
                      <div className="py-4">
                        <h3 className="text-lg font-medium mb-4">Print Name Tag</h3>
                        {childData && classData && (
                          <div className="space-y-8">
                            <NameTagPrinter 
                              childName={childData.name}
                              childId={childData.id}
                              className={classData.name}
                              allergies={childData.allergies}
                              securityCode={childData.securityCode || "12345"}
                              onPrintComplete={handlePrintComplete}
                              onBack={() => setActiveCheckInStep("class")}
                            />
                            
                            <div className="mt-8 border-t pt-6">
                              <h4 className="font-medium mb-4">Security QR Code</h4>
                              <QRCodeGenerator 
                                userId={childData.id} 
                                userName={childData.name}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check-In Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-purple-600" />
                      Step 1: Phone Verification
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter the parent's phone number to lookup their family.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      Step 2: Child Selection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select which children are being checked in.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
                      Step 3: Class Assignment
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select the appropriate class or room for each child.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Printer className="h-4 w-4 mr-2 text-purple-600" />
                      Step 4: Name Tag Printing
                    </h3>
                    <p className="text-sm text-gray-600">
                      Print name tags and security tags for pickup.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Label Printer Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <Printer className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Label Printer</p>
                        <p className="text-xs text-green-600">Connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Test Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Check-Out Tab Content */}
        <TabsContent value="check-out">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Child Check-Out</CardTitle>
                  <CardDescription>
                    Process for checking out children
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeCheckoutTab} onValueChange={setActiveCheckoutTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="scan">
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan QR Code
                      </TabsTrigger>
                      <TabsTrigger value="search">
                        <Search className="mr-2 h-4 w-4" />
                        Search Child
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="scan" className="space-y-4">
                      <QrCodeScanner onScanComplete={handleScanComplete} />
                    </TabsContent>
                    <TabsContent value="search" className="space-y-4">
                      <SearchForm 
                        onSearchResults={setCheckoutResults} 
                        onReset={() => setCheckoutResults([])} 
                        onResultsFound={setCheckoutResults} 
                      />
                      {checkoutResults.length > 0 && (
                        <CheckoutTable 
                          data={checkoutResults} 
                          title="Search Results" 
                          showClearButton 
                          onClear={() => setCheckoutResults([])} 
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* Recent Check-outs */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Check-outs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center bg-gray-100 rounded-full">
                      <CalendarOff className="h-6 w-6" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent check-outs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Recent check-outs will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check-Out Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <QrCode className="h-4 w-4 mr-2 text-purple-600" />
                      Option 1: Scan QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Scan the security QR code from the parent's pickup tag.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Search className="h-4 w-4 mr-2 text-purple-600" />
                      Option 2: Search by Name
                    </h3>
                    <p className="text-sm text-gray-600">
                      Search for children by name or phone number.
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-medium">Verify Identity</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Always verify the identity of the person picking up the child.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Security Reminder</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
                    <p className="font-medium">Important:</p>
                    <p className="text-sm mt-1">
                      Only authorized adults with valid pickup tags or IDs can check out children.
                      Verify the identity of all adults picking up children.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default CheckInOutManagement;
