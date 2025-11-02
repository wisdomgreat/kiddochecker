
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, LogOut, Clock, QrCode, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import QRCodeScanner from "@/components/qr/QRCodeScanner";

const CheckOutStation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Fetch children currently present with realtime updates
  const { data: presentChildren = [], isLoading } = useQuery({
    queryKey: ["present-children"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name, allergies, emergency_contact_name, medical_info),
          classes (name)
        `)
        .eq('attendance_date', today)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Setup realtime subscription for attendance changes
  useEffect(() => {
    const channel = supabase
      .channel('checkout-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["present-children"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('attendance')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: user?.id,
        })
        .eq('id', attendanceId)
        .select(`
          *,
          children (first_name, last_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Check-out Successful",
        description: `${data.children?.first_name} ${data.children?.last_name} has been checked out.`,
      });
      queryClient.invalidateQueries({ queryKey: ["present-children"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredChildren = presentChildren.filter((record: any) =>
    record.children?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.children?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckOut = (attendanceId: string) => {
    checkOutMutation.mutate(attendanceId);
  };

  const handleQRCodeScanned = (qrData: string) => {
    console.log("QR Code scanned:", qrData);
    setShowScanner(false);

    try {
      // Try to parse as JSON first
      const parsedData = JSON.parse(qrData);
      
      if (parsedData.childId) {
        // Find attendance record by child_id
        const attendanceRecord = presentChildren.find((record: any) => 
          record.child_id === parsedData.childId
        );
        
        if (attendanceRecord) {
          handleCheckOut(attendanceRecord.id);
        } else {
          toast({
            title: "Child Not Found",
            description: "This child is not currently checked in.",
            variant: "destructive",
          });
        }
      } else if (parsedData.attendanceId) {
        handleCheckOut(parsedData.attendanceId);
      } else {
        toast({
          title: "Invalid QR Code",
          description: "QR code format not recognized.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // If not JSON, try to match as child_id or attendance_id
      const attendanceRecord = presentChildren.find((record: any) => 
        record.id === qrData.trim() || record.child_id === qrData.trim()
      );
      
      if (attendanceRecord) {
        handleCheckOut(attendanceRecord.id);
      } else {
        toast({
          title: "Invalid QR Code",
          description: "Could not find matching record.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <LogOut className="h-8 w-8 text-red-600" />
              Check-Out Station
            </CardTitle>
            <p className="text-muted-foreground">Scan QR codes or search to check out children</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Scanner */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Check-Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showScanner ? (
                  <div className="space-y-4">
                    <QRCodeScanner 
                      onScanComplete={handleQRCodeScanned}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowScanner(false)}
                      className="w-full"
                    >
                      Cancel Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowScanner(true)}
                      className="w-full"
                      size="lg"
                    >
                      <QrCode className="h-5 w-5 mr-2" />
                      Start QR Scanner
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Scan the QR code from the child's name tag or parent's phone
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Manual Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by child's name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <Clock className="animate-spin h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>Loading present children...</p>
                  </div>
                ) : filteredChildren.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 
                      `No children found matching "${searchTerm}"` : 
                      "No children currently present"
                    }
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredChildren.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <div>
                              <p className="font-medium">
                                {record.children?.first_name} {record.children?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Class: {record.classes?.name || 'No class assigned'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Checked in: {format(new Date(record.checked_in_at), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.children?.allergies && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {record.children.allergies}
                              </Badge>
                            )}
                            {record.children?.medical_info && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                Medical Info
                              </Badge>
                            )}
                            {record.children?.emergency_contact_name && (
                              <Badge variant="secondary" className="text-xs">
                                Emergency: {record.children.emergency_contact_name}
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => handleCheckOut(record.id)}
                            disabled={checkOutMutation.isPending}
                            size="sm"
                          >
                            {checkOutMutation.isPending ? (
                              <>
                                <Clock className="animate-spin h-4 w-4 mr-2" />
                                Checking Out...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Check Out
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Children Present</p>
                  <p className="text-2xl font-bold">{presentChildren.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Longest Present</p>
                  <p className="text-lg font-bold">
                    {presentChildren.length > 0 ? 
                      Math.max(...presentChildren.map((r: any) => 
                        Math.floor((new Date().getTime() - new Date(r.checked_in_at).getTime()) / (1000 * 60 * 60))
                      )) + 'h' : '0h'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Ready for Pickup</p>
                  <p className="text-2xl font-bold">{presentChildren.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckOutStation;
