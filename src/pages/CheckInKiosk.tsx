
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Phone, Lock, Users, Clock, CheckCircle, ArrowLeft, Monitor } from "lucide-react";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
}

interface Class {
  id: string;
  name: string;
}

const CheckInKiosk = () => {
  const [step, setStep] = useState<'auth' | 'select' | 'success'>('auth');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [authenticatedParentId, setAuthenticatedParentId] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleParentAuth = async () => {
    if (!phoneNumber || !pin) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and PIN/password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const fakeEmail = `${cleanedPhone}@phone.local`;
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: pin,
      });

      if (authError) {
        throw new Error("Invalid phone number or PIN. Please try again.");
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Get children for this parent
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, parent_id')
        .eq('parent_id', authData.user.id);

      if (childrenError) throw childrenError;

      if (!childrenData || childrenData.length === 0) {
        throw new Error("No children found for this account");
      }

      setChildren(childrenData);
      setAuthenticatedParentId(authData.user.id);
      setStep('select');
      
      toast({
        title: "Authentication Successful",
        description: `Welcome! Please select your child to check in.`,
      });

    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Please check your phone number and PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedChild) {
      toast({
        title: "Selection Required",
        description: "Please select a child to check in",
        variant: "destructive",
      });
      return;
    }

    if (!authenticatedParentId) {
      toast({
        title: "Authentication Error",
        description: "Please authenticate again",
        variant: "destructive",
      });
      setStep('auth');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if child is already checked in today
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('child_id', selectedChild)
        .eq('attendance_date', today)
        .is('checked_out_at', null);

      if (checkError) throw checkError;

      if (existingAttendance && existingAttendance.length > 0) {
        throw new Error("This child is already checked in today");
      }

      // Create attendance record
      const attendanceData = {
        child_id: selectedChild,
        class_id: selectedClass || null,
        checked_in_at: new Date().toISOString(),
        checked_in_by: authenticatedParentId,
        attendance_date: today
      };

      const { data: newAttendance, error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (insertError) throw insertError;

      setAttendanceId(newAttendance.id);
      setStep('success');
      
      toast({
        title: "Check-In Successful!",
        description: "Your child has been checked in successfully.",
      });

    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setStep('auth');
    setPhoneNumber("");
    setPin("");
    setChildren([]);
    setSelectedChild("");
    setSelectedClass("");
    setAuthenticatedParentId(null);
    setAttendanceId(null);
  };

  const selectedChildData = children.find(child => child.id === selectedChild);
  const selectedClassData = classes.find(cls => cls.id === selectedClass);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Monitor className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">KiddoChecker Kiosk</h1>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-semibold text-gray-700">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Authentication Step */}
        {step === 'auth' && (
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Phone className="h-6 w-6 text-blue-600" />
                Parent Authentication
              </CardTitle>
              <p className="text-gray-600 mt-2">Enter your phone number and PIN to check in your child</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium mb-2">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-xl p-6 h-14"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-2">PIN / Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your PIN or password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-xl p-6 h-14"
                    onKeyPress={(e) => e.key === 'Enter' && handleParentAuth()}
                  />
                </div>
              </div>

              <Button 
                onClick={handleParentAuth}
                disabled={!phoneNumber || !pin || loading}
                className="w-full h-14 text-xl bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Lock className="mr-2 h-6 w-6" />
                    Authenticate
                  </div>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account? Contact the front desk for assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Child Selection Step */}
        {step === 'select' && (
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                Select Child to Check In
              </CardTitle>
              <p className="text-gray-600 mt-2">Choose your child and their class (optional)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium mb-3">Select Child</label>
                  <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Choose your child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id} className="text-lg p-3">
                          {child.first_name} {child.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-lg font-medium mb-3">Select Class (Optional)</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Choose a class (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-lg p-3">No specific class</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} className="text-lg p-3">
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedChild && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Check-In Summary</h3>
                  <div className="space-y-1">
                    <p><strong>Child:</strong> {selectedChildData?.first_name} {selectedChildData?.last_name}</p>
                    <p><strong>Class:</strong> {selectedClassData?.name || 'No class selected'}</p>
                    <p><strong>Time:</strong> {currentTime.toLocaleTimeString()}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={resetKiosk}
                  className="flex-1 h-14 text-lg"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleCheckIn}
                  disabled={!selectedChild || loading}
                  className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-2"></div>
                      Checking In...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      Check In
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <Card className="shadow-xl border-green-200 bg-green-50">
            <CardContent className="text-center py-12">
              <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-green-800 mb-4">Check-In Successful!</h2>
              
              {selectedChildData && attendanceId && (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <h3 className="text-xl font-semibold mb-4">Check-In Details</h3>
                  <div className="space-y-2 text-lg mb-4">
                    <p><strong>Child:</strong> {selectedChildData.first_name} {selectedChildData.last_name}</p>
                    <p><strong>Class:</strong> {selectedClassData?.name || 'No class assigned'}</p>
                    <p><strong>Check-In Time:</strong> {currentTime.toLocaleTimeString()}</p>
                    <Badge className="mt-2 bg-green-100 text-green-800">Successfully Checked In</Badge>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Check-Out QR Code</h4>
                    <QRCodeGenerator
                      attendanceId={attendanceId}
                      childName={`${selectedChildData.first_name} ${selectedChildData.last_name}`}
                      className={selectedClassData?.name}
                      size={150}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={resetKiosk}
                className="h-14 text-xl px-8 bg-blue-600 hover:bg-blue-700"
              >
                Check In Another Child
              </Button>
              
              <p className="text-gray-600 mt-4">
                Have a great day! Remember to check out when you leave.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CheckInKiosk;
