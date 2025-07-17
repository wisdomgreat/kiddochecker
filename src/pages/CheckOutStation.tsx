
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, LogOut, Clock, QrCode, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const CheckOutStation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");

  // Fetch children currently present (checked in but not out)
  const { data: presentChildren = [], isLoading } = useQuery({
    queryKey: ["present-children"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name, allergies, emergency_contact_name),
          classes (name)
        `)
        .eq('attendance_date', today)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

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

  const handleQRScan = () => {
    if (!qrCodeData.trim()) {
      toast({
        title: "No QR Code Data",
        description: "Please scan or enter QR code data.",
        variant: "destructive",
      });
      return;
    }

    try {
      const qrData = JSON.parse(qrCodeData);
      if (qrData.type === "CHECKOUT" && qrData.attendanceId) {
        handleCheckOut(qrData.attendanceId);
        setQrCodeData("");
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for check-out.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Try to find attendance by ID if not JSON
      const attendanceRecord = presentChildren.find((record: any) => 
        record.id === qrCodeData.trim()
      );
      
      if (attendanceRecord) {
        handleCheckOut(qrCodeData.trim());
        setQrCodeData("");
      } else {
        toast({
          title: "Invalid QR Code",
          description: "Could not parse QR code data.",
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan QR code or enter code manually..."
                    value={qrCodeData}
                    onChange={(e) => setQrCodeData(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleQRScan}
                    disabled={!qrCodeData.trim() || checkOutMutation.isPending}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Position QR code in front of camera or enter the code manually
                </p>
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
                        
                        <div className="flex items-center gap-3">
                          {record.children?.allergies && (
                            <Badge variant="destructive" className="text-xs">
                              Allergies
                            </Badge>
                          )}
                          {record.children?.emergency_contact_name && (
                            <Badge variant="outline" className="text-xs">
                              Emergency: {record.children.emergency_contact_name}
                            </Badge>
                          )}
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
