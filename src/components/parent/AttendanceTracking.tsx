import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/CleanAuthContext";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  child_id: string;
  check_in_time: string;
  check_out_time: string | null;
  location: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const AttendanceTracking = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: attendanceRecords = [], isLoading, error } = useQuery({
    queryKey: ["attendance", user?.id, formattedDate],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('parent_id', user.id)
          .eq('date', formattedDate)
          .order('check_in_time', { ascending: false });

        if (error) {
          console.error("Error fetching attendance:", error);
          return [];
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in AttendanceTracking:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Attendance Tracking</h2>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={formattedDate}
          onChange={(e) => handleDateChange(new Date(e.target.value))}
        />
      </div>

      {isLoading ? (
        <Card className="col-span-full">
          <CardContent className="p-6 flex justify-center items-center">
            <div className="animate-pulse text-center">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      ) : attendanceRecords.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-2" />
            <h3 className="font-medium text-lg">No attendance records for {format(selectedDate, "MMMM dd, yyyy")}</h3>
            <p className="text-gray-500">Check back after your child has been checked in/out.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendanceRecords.map(record => (
            <Card key={record.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Child ID: {record.child_id}</span>
                  <Badge variant="secondary">Present</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-1" />
                  <span>Check-In: {format(new Date(record.check_in_time), "hh:mm a")}</span>
                </div>
                {record.check_out_time && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={14} className="mr-1" />
                    <span>Check-Out: {format(new Date(record.check_out_time), "hh:mm a")}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1" />
                  <span>Location: {record.location}</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;
