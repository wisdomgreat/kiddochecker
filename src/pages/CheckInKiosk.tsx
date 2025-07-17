
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Clock, AlertTriangle, CheckCircle, Printer } from "lucide-react";
import QRCodeGenerator from "@/components/check-in/QRCodeGenerator";
import { format } from "date-fns";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies: string;
  medical_info: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const CheckInKiosk = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [generatedAttendance, setGeneratedAttendance] = useState<any>(null);

  // Fetch all children
  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["all-children-checkin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Check today's attendance
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["today-attendance-checkin"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('attendance_date', today);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ childId, classId }: { childId: string; classId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const attendanceData = {
        child_id: childId,
        class_id: classId || null,
        attendance_date: new Date().toISOString().split('T')[0],
        checked_in_at: new Date().toISOString(),
        checked_in_by: user?.id,
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedAttendance(data);
      setShowQRCode(true);
      toast({
        title: "Check-in Successful",
        description: `${selectedChild?.first_name} has been checked in successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["today-attendance-checkin"] });
      
      // Reset form
      setSelectedChild(null);
      setSearchTerm("");
      setSelectedClass("");
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredChildren = children.filter((child: Child) => {
    const searchMatch = child.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       child.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if already checked in today
    const alreadyCheckedIn = todayAttendance.some(
      (attendance: any) => attendance.child_id === child.id && !attendance.checked_out_at
    );
    
    return searchMatch && !alreadyCheckedIn;
  });

  const handleCheckIn = () => {
    if (!selectedChild) {
      toast({
        title: "No Child Selected",
        description: "Please select a child to check in.",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({
      childId: selectedChild.id,
      classId: selectedClass || undefined
    });
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
  };

  const handlePrintQR = () => {
    toast({
      title: "Printing QR Code",
      description: "QR code sent to printer.",
    });
  };

  if (showQRCode && generatedAttendance && selectedChild) {
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="space-y-6 w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Check-in Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg mb-4">
                <strong>{selectedChild.first_name} {selectedChild.last_name}</strong> has been successfully checked in.
              </p>
              {selectedClassName && (
                <Badge className="mb-4">{selectedClassName}</Badge>
              )}
              <p className="text-sm text-muted-foreground">
                Time: {format(new Date(generatedAttendance.checked_in_at), 'MMMM dd, yyyy at HH:mm')}
              </p>
            </CardContent>
          </Card>

          <QRCodeGenerator
            attendanceId={generatedAttendance.id}
            childName={`${selectedChild.first_name} ${selectedChild.last_name}`}
            className={selectedClassName}
            checkInTime={format(new Date(generatedAttendance.checked_in_at), 'HH:mm')}
            onPrint={handlePrintQR}
          />

          <div className="text-center">
            <Button 
              onClick={() => {
                setShowQRCode(false);
                setGeneratedAttendance(null);
              }}
              variant="outline"
              className="mr-4"
            >
              Back to Check-in
            </Button>
            <Button 
              onClick={() => window.location.reload()}
            >
              New Check-in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Check-In Kiosk
            </CardTitle>
            <p className="text-muted-foreground">Search and check in children</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by child's name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific class</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Child */}
            {selectedChild && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-2">Selected Child</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Age: {selectedChild.age || 'Not specified'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedChild.allergies && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Allergies
                        </Badge>
                      )}
                      {selectedChild.medical_info && (
                        <Badge variant="secondary">Medical Info</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={handleCheckIn} 
                      disabled={checkInMutation.isPending}
                      className="flex-1"
                    >
                      {checkInMutation.isPending ? (
                        <>
                          <Clock className="animate-spin h-4 w-4 mr-2" />
                          Checking In...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => setSelectedChild(null)} 
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {searchTerm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Search Results ({filteredChildren.length} found)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingChildren ? (
                    <div className="text-center py-8">
                      <Clock className="animate-spin h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p>Loading children...</p>
                    </div>
                  ) : filteredChildren.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No available children found for "{searchTerm}"
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredChildren.map((child: Child) => (
                        <div
                          key={child.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedChild?.id === child.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleChildSelect(child)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {child.first_name} {child.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {child.age ? `${child.age} years old` : 'Age not specified'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {child.allergies && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Allergies
                                </Badge>
                              )}
                              {child.emergency_contact_name && (
                                <Badge variant="outline" className="text-xs">
                                  Emergency Contact
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInKiosk;
