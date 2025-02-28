
import { useState } from "react";
import { QrCode, User, Phone, Check, Calendar, AlertTriangle, Info } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Define types for check-in data
interface CheckInItem {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
}

// Mock data for recent check-ins
const recentCheckIns: CheckInItem[] = [
  { id: "1", name: "Emma Wilson", class: "Preschool Class", status: "Checked in", time: "9:45 AM" },
  { id: "2", name: "Noah Johnson", class: "Elementary Class", status: "Checked in", time: "9:48 AM" },
  { id: "3", name: "Ava Davis", class: "Preschool Class", status: "Checked in", time: "9:50 AM" },
];

const CheckInKiosk = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"phone" | "children" | "confirmation">("phone");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock data for children associated with a parent
  const availableChildren = [
    { id: "1", name: "Emma Wilson", age: 4, class: "Preschool Class" },
    { id: "2", name: "Jack Wilson", age: 6, class: "Elementary Class" },
  ];

  const handlePhoneSubmit = () => {
    // In a real application, this would verify the phone number
    // and load the associated children
    console.log("Phone submitted:", phoneNumber);
    setStep("children");
  };

  const handleChildSelection = (childId: string) => {
    setSelectedChildren((prev) => {
      if (prev.includes(childId)) {
        return prev.filter((id) => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  const handleConfirmCheckIn = () => {
    console.log("Children checked in:", selectedChildren);
    setStep("confirmation");
    toast({
      title: "Check-in Successful",
      description: `${selectedChildren.length} children have been checked in`,
      variant: "default",
    });
    // In a real app, this would submit the check-in to the server
  };

  const handleRestart = () => {
    setPhoneNumber("");
    setSelectedChildren([]);
    setStep("phone");
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Check-in Kiosk</h1>
        <p className="text-gray-500">Check in children using their parent's phone number or QR code.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === "phone" && <Phone className="h-5 w-5 text-primary" />}
              {step === "children" && <User className="h-5 w-5 text-primary" />}
              {step === "confirmation" && <Check className="h-5 w-5 text-primary" />}
              {step === "phone" && "Enter Parent Phone Number"}
              {step === "children" && "Select Children to Check In"}
              {step === "confirmation" && "Check-in Complete"}
            </CardTitle>
            <CardDescription>
              {step === "phone" && "Please enter the parent's phone number to find their children"}
              {step === "children" && "Select which children you would like to check in today"}
              {step === "confirmation" && "Children have been successfully checked in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === "children" && (
              <div className="space-y-4">
                {availableChildren.map((child) => (
                  <div
                    key={child.id}
                    className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${
                      selectedChildren.includes(child.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/20"
                    }`}
                    onClick={() => handleChildSelection(child.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-full p-2">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Age {child.age} • {child.class}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={() => handleChildSelection(child.id)}
                      className="data-[state=checked]:border-primary"
                    />
                  </div>
                ))}
              </div>
            )}

            {step === "confirmation" && (
              <div className="text-center space-y-4">
                <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Check-in Successful!</h3>
                <p className="text-muted-foreground">
                  The following children have been checked in:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
                  {availableChildren
                    .filter((child) => selectedChildren.includes(child.id))
                    .map((child) => (
                      <div key={child.id} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          {child.name} ({child.class})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step === "phone" && (
              <>
                <Button variant="outline" className="w-full sm:w-auto">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>
                <Button 
                  onClick={handlePhoneSubmit} 
                  disabled={!phoneNumber}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </>
            )}

            {step === "children" && (
              <>
                <Button variant="outline" onClick={() => setStep("phone")}>
                  Back
                </Button>
                <Button
                  onClick={handleConfirmCheckIn}
                  disabled={selectedChildren.length === 0}
                >
                  Check In {selectedChildren.length > 0 && `(${selectedChildren.length})`}
                </Button>
              </>
            )}

            {step === "confirmation" && (
              <Button onClick={handleRestart} className="w-full">
                New Check-in
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="bg-primary/10 rounded-full p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{checkIn.name}</p>
                      <p className="text-xs text-muted-foreground">{checkIn.class} • {checkIn.time}</p>
                    </div>
                    <div className="bg-green-100 text-green-600 rounded-full px-2 py-1 text-xs font-medium">
                      {checkIn.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you're having trouble with the check-in process, please speak with a staff member for assistance.
              </p>
              <Button variant="secondary" className="w-full">
                Request Assistance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckInKiosk;
