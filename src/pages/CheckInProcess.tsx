
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Users, ArrowRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useChildren } from "@/hooks/useChildren";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance } from "@/hooks/useAttendance";
import ClassSelectionForm from "@/components/check-in/ClassSelectionForm";
import NameTagPrinter from "@/components/check-in/NameTagPrinter";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  allergies: string | null;
  securityCode?: string;
  selectedClass?: {
    id: string;
    name: string;
  };
  attendanceId?: string;
  checkedIn: boolean;
}

const CheckInProcess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { children: childrenData } = useChildren();
  const { classes } = useClasses();
  const { checkIn } = useAttendance();
  
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("select-class");
  const [allCheckedIn, setAllCheckedIn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (childrenData && childrenData.length > 0) {
      const childrenWithSecurityCodes = childrenData
        .filter(child => child.parent_id === user.id)
        .map((child) => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          age: child.age || 0,
          allergies: child.allergies,
          securityCode: generateSecurityCode(),
          checkedIn: false,
        }));
      
      if (childrenWithSecurityCodes.length === 0) {
        toast({
          title: "No children found",
          description: "Please add children to your account first",
          variant: "destructive",
        });
        navigate("/parent-dashboard");
        return;
      }
      
      setChildren(childrenWithSecurityCodes);
    }
  }, [user, childrenData, navigate, toast]);

  const generateSecurityCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleClassSelected = (classId: string, className: string) => {
    const updatedChildren = [...children];
    updatedChildren[currentChildIndex].selectedClass = {
      id: classId,
      name: className,
    };
    setChildren(updatedChildren);
    setActiveTab("print-tag");
  };

  const handleCheckIn = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const currentChild = children[currentChildIndex];
      if (!currentChild.selectedClass) {
        throw new Error("Please select a class first");
      }
      
      // Use the checkIn function from useAttendance
      checkIn({ 
        childId: currentChild.id, 
        classId: currentChild.selectedClass.id 
      });
      
      // Update the child with checked-in status
      const updatedChildren = [...children];
      updatedChildren[currentChildIndex] = {
        ...currentChild,
        checkedIn: true,
      };
      setChildren(updatedChildren);
      
      toast({
        title: "Check-in successful",
        description: `${currentChild.firstName} has been checked in to ${currentChild.selectedClass.name}`,
      });
      
      // Move to next child or complete process
      if (currentChildIndex < children.length - 1) {
        setCurrentChildIndex(currentChildIndex + 1);
        setActiveTab("select-class");
      } else {
        setAllCheckedIn(true);
      }
      
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const finishCheckin = () => {
    navigate("/parent-dashboard");
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (allCheckedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-green-100 p-6 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All Children Checked In!</h2>
              <p className="text-gray-600 text-center mb-6 max-w-lg">
                Your children have been successfully checked in. Please keep the security codes for pickup.
              </p>
              
              <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">Security Codes for Pickup:</h3>
                <ul className="space-y-2">
                  {children.map((child) => (
                    <li key={child.id} className="flex justify-between items-center border-b pb-2 border-blue-100">
                      <span>{child.firstName} {child.lastName}</span>
                      <span className="font-bold">{child.securityCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button onClick={finishCheckin} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Children Found</h2>
            <p className="text-gray-600 mb-4">Please add children to your account first.</p>
            <Button onClick={() => navigate("/parent-dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentChild = children[currentChildIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Child Check-in</h1>
          <div className="bg-blue-100 px-3 py-1 rounded-full flex items-center text-sm text-blue-800">
            <Users className="h-4 w-4 mr-1" />
            Child {currentChildIndex + 1} of {children.length}
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                {currentChild.firstName} {currentChild.lastName}
              </h2>
              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-100 px-2 py-1 rounded text-sm">Age: {currentChild.age}</div>
                {currentChild.allergies && (
                  <div className="bg-red-50 text-red-700 px-2 py-1 rounded text-sm flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Allergies: {currentChild.allergies}
                  </div>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="select-class">Select Class</TabsTrigger>
                <TabsTrigger value="print-tag" disabled={!currentChild.selectedClass}>Print Tag</TabsTrigger>
                <TabsTrigger value="qr-code" disabled={!currentChild.attendanceId}>QR Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="select-class" className="py-4">
                <ClassSelectionForm 
                  childId={currentChild.id}
                  childAge={currentChild.age}
                  onClassSelected={handleClassSelected}
                  selectedClassId={currentChild.selectedClass?.id}
                />
              </TabsContent>
              
              <TabsContent value="print-tag" className="py-4">
                {currentChild.selectedClass && (
                  <div className="space-y-6">
                    <p className="text-gray-600">
                      {currentChild.firstName} will be checked in to <strong>{currentChild.selectedClass.name}</strong>
                    </p>
                    
                    <NameTagPrinter 
                      childName={`${currentChild.firstName} ${currentChild.lastName}`}
                      childId={currentChild.id}
                      className={currentChild.selectedClass.name}
                      allergies={currentChild.allergies || undefined}
                      securityCode={currentChild.securityCode || ""}
                    />
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-yellow-800">
                        IMPORTANT: Remember your security code for pickup: <strong>{currentChild.securityCode}</strong>
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("select-class")}
                      >
                        Change Class
                      </Button>
                      <Button 
                        onClick={handleCheckIn}
                        disabled={loading || currentChild.checkedIn}
                      >
                        {loading ? "Processing..." : currentChild.checkedIn 
                          ? "Checked In" 
                          : (
                            <div className="flex items-center">
                              Check In {currentChild.firstName} <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                          )
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="qr-code" className="py-4">
                {currentChild.attendanceId && currentChild.selectedClass && (
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">Checkout QR Code</h3>
                    <QRCodeGenerator 
                      attendanceId={currentChild.attendanceId}
                      childName={`${currentChild.firstName} ${currentChild.lastName}`}
                      className={currentChild.selectedClass.name}
                    />
                    <p className="text-sm text-gray-600">
                      Save this QR code or take a screenshot for quick checkout
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInProcess;
