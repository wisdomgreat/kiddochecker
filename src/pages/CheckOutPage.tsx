import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, LogOut, Clock, QrCode, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { QRService } from "@/services/QRService";
import { AttendanceService } from "@/services/attendanceService";
import { useAuth } from "@/context/AuthContext";

const CheckOutPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, isSuperAdmin, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const allowedRoles = ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk'];
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground text-center">
            Only designated Kiosk terminals or Administrators can access check-out.
          </p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

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
    mutationFn: async ({ attendanceId, qrToken }: { attendanceId: string, qrToken?: string }) => {
      const result = await AttendanceService.checkOutChild({
        attendanceId,
        qrToken
      });

      if (!result.success) throw new Error(result.error || "Check-out failed");
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Check-out Successful",
        description: "Child has been checked out successfully.",
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

  const handleCheckOut = (attendanceId: string, qrToken?: string) => {
    checkOutMutation.mutate({ attendanceId, qrToken });
  };

  const handleQRCodeScanned = async (qrData: string) => {
    console.log("QR Code scanned:", qrData);
    setShowScanner(false);

    try {
      const result = await QRService.parseAndVerify(qrData);
      
      if (result.type === 'error') {
        toast({ title: "Scan Failed", description: result.message, variant: "destructive" });
        return;
      }

      if (result.type === 'child') {
        const childId = result.id;
        const attendanceRecord = presentChildren.find((record: any) =>
          record.child_id === childId
        );

        if (attendanceRecord) {
          handleCheckOut(attendanceRecord.id, qrData);
        } else {
          toast({ title: "Child Not Found", description: "This child is not currently checked in.", variant: "destructive" });
        }
        return;
      }

      toast({ title: "Scan Failed", description: "Code not recognized.", variant: "destructive" });
    } catch (error) {
      console.error("Error processing QR:", error);
      toast({
        title: "Scan Failed",
        description: "Could not verify QR code data.",
        variant: "destructive",
      });
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Child Check-Out</h1>
            <p className="text-muted-foreground">Scan QR codes or search to check out children currently present</p>
          </div>
          {presentChildren.length > 0 && (isAdmin || isSuperAdmin) && (
            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={async () => {
                if (!window.confirm(`Are you sure you want to sign out ALL ${presentChildren.length} children? This is an emergency action.`)) return;

                let successCount = 0;
                for (const record of presentChildren) {
                  try {
                    const res = await AttendanceService.checkOutChild({
                      attendanceId: record.id,
                      checkedOutBy: user?.id,
                      method: 'emergency_admin_bulk',
                      station: 'Check-Out Dashboard'
                    });
                    if (res.success) successCount++;
                  } catch { }
                }
                toast({ title: "Bulk Sign-Out Complete", description: `Successfully signed out ${successCount} children.` });
                queryClient.invalidateQueries({ queryKey: ["present-children"] });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign-Out All ({presentChildren.length})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* QR Code Scanner */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden overflow-ellipsis">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  QR Scanner
                </CardTitle>
                <CardDescription>Scan child or parent QR code</CardDescription>
              </CardHeader>
              <CardContent>
                {showScanner ? (
                  <div className="space-y-4">
                    <QRCodeScanner onScanComplete={handleQRCodeScanned} />
                    <Button
                      variant="outline"
                      onClick={() => setShowScanner(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="w-full h-32 flex-col gap-2"
                    variant="outline"
                  >
                    <QrCode className="h-8 w-8" />
                    <span>Open Camera</span>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Present Now</p>
                      <p className="text-2xl font-bold">{presentChildren.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Manual List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Currently Checked In</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search children..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading attendance data...</p>
                  </div>
                ) : filteredChildren.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">
                      {searchTerm ? 'No results found' : 'No children present'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredChildren.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/30 transition-colors gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <div>
                            <p className="font-semibold text-lg">
                              {record.children?.first_name} {record.children?.last_name}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {record.classes && (
                                <Badge variant="secondary" className="text-xs">
                                  {record.classes.name}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                In: {format(new Date(record.checked_in_at), 'h:mm a')}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {record.children?.allergies && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Allergy: {record.children.allergies}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCheckOut(record.id)}
                          disabled={checkOutMutation.isPending}
                          variant="destructive"
                          className="sm:w-auto w-full shadow-sm"
                        >
                          {checkOutMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-2" />
                              Check Out
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CheckOutPage;

