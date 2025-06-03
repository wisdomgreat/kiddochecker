
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReportFilter {
  startDate: string;
  endDate: string;
  classId?: string;
  reportType: 'attendance' | 'demographics' | 'classes' | 'custom';
}

export interface AttendanceReportData {
  date: string;
  childName: string;
  className: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  parentName: string;
  parentEmail: string;
}

export const useAdvancedReports = () => {
  const { toast } = useToast();

  const generateAttendanceReport = useQuery({
    queryKey: ["attendance-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const exportToCSV = useMutation({
    mutationFn: async (data: any[]) => {
      if (!data || data.length === 0) {
        throw new Error("No data to export");
      }

      // Convert data to CSV format
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Report has been downloaded as CSV file",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    },
  });

  const exportToPDF = useMutation({
    mutationFn: async (data: any[]) => {
      // This would require a PDF generation library like jsPDF
      // For now, we'll show a placeholder
      toast({
        title: "PDF Export",
        description: "PDF export functionality coming soon. Use CSV export for now.",
      });
      return { success: true };
    },
  });

  const generateCustomReport = useMutation({
    mutationFn: async (filters: ReportFilter) => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: filters.startDate,
        end_date: filters.endDate
      });

      if (error) throw error;

      // Apply additional filters if needed
      let filteredData = data;
      if (filters.classId) {
        filteredData = data.filter((record: any) => record.class_id === filters.classId);
      }

      return filteredData;
    },
    onSuccess: () => {
      toast({
        title: "Report generated",
        description: "Custom report has been generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Report generation failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  return {
    generateAttendanceReport: generateAttendanceReport.refetch,
    attendanceReportData: generateAttendanceReport.data,
    isGeneratingReport: generateAttendanceReport.isFetching,
    exportToCSV: exportToCSV.mutate,
    exportToPDF: exportToPDF.mutate,
    generateCustomReport: generateCustomReport.mutate,
    isExporting: exportToCSV.isPending || exportToPDF.isPending,
    isGeneratingCustomReport: generateCustomReport.isPending,
  };
};
