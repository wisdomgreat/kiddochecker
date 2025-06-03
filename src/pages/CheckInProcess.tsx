
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Users, ArrowRight, AlertTriangle } from "lucide-react";
import ClassSelectionForm from "@/components/check-in/ClassSelectionForm";
import NameTagPrinter from "@/components/check-in/NameTagPrinter";
import QRCodeGenerator from "@/components/check-in/QRCodeGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("select-class");
  const [allCheckedIn, setAllCheckedIn] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch children for the logged-in parent
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id);
          
        if (error) throw error;
        
        if (!data || data.length === 0) {
          toast({
            title: "No children found",
            description: "Please add children to your account first",
            variant: "destructive",
          });
          navigate("/parent-dashboard");
          return;
        }
        
        // Transform data and generate security codes
        const childrenWithSecurityCodes = data.map((child) => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          age: child.age || 0,
          allergies: child.allergies,
          securityCode: generateSecurityCode(),
          checkedIn: false,
        }));
        
        setChildren(childrenWithSecurityCodes);
      } catch (error: any) {
        console.error("Error fetching children:", error);
        toast({
          title: "Error loading children",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchChildren();
  }, [user, navigate, toast]);

  // Generate a random security code for child pickup
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
      
      // Record attendance in the database
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            child_id: currentChild.id,
            class_id: currentChild.selectedClass.id,
            attendance_date: today,
            checked_in_at: new Date().toISOString(),
            checked_in_by: user.id,
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Update the child with attendance ID and checked-in status
      const updatedChildren = [...children];
      updatedChildren[currentChildIndex] = {
        ...currentChild,
        attendanceId: data[0].id,
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

  const goToNextChild = () => {
    if (currentChildIndex < children.length - 1) {
      setCurrentChildIndex(currentChildIndex + 1);
      setActiveTab("select-class");
    } else {
      setAllCheckedIn(true);
    }
  };

  const finishCheckin = () => {
    navigate("/parent-dashboard");
  };

  if (loading && children.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  if (allCheckedIn) {
    return (
      <MainLayout>
        <Breadcrumb
          items={[
            { label: "Home", path: "/" },
            { label: "Check-in" },
          ]}
        />
        
        <Card className="bg-white my-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-green-100 p-6 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All Children Checked In!</h2>
              <p className="text-gray-600 text-center mb-6 max-w-lg">
                Your children have been successfully checked in. Please keep the security codes for pickup.
              </p>
              
              <div className="w-full max-w-md bg-blue-50 rounded-lg p-4 mb-6">
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
              
              <Button onClick={finishCheckin} className="w-full max-w-xs">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const currentChild = children[currentChildIndex];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Check-in" },
        ]}
      />
      
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Child Check-in</h1>
        <div className="bg-blue-100 px-3 py-1 rounded-full flex items-center text-sm text-blue-800">
          <Users className="h-4 w-4 mr-1" />
          Child {currentChildIndex + 1} of {children.length}
        </div>
      </div>
      
      <Card className="bg-white mb-6">
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
          
          {currentChild.checkedIn && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => setActiveTab("qr-code")}
              >
                View QR Code for Checkout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CheckInProcess;
