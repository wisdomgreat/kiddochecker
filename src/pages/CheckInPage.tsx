
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, CheckCircle } from "lucide-react";

const CheckInPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async (childId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          child_id: childId,
          attendance_date: new Date().toISOString().split('T')[0],
          checked_in_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child checked in successfully",
      });
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: "Failed to check in child",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Check-In System</h1>
        <p className="text-muted-foreground">Quick and easy child check-in</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check In Child
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or scan QR code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Kiosk Mode Active
            </Badge>
            <p className="text-sm text-muted-foreground">
              Use the search above or scan a QR code to check in a child
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
