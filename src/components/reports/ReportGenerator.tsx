
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportGeneratorProps } from "@/types/reports";

const ReportGenerator = ({ open, onOpenChange, onClose }: ReportGeneratorProps) => {
  const [reportType, setReportType] = useState("attendance");
  const [dateRange, setDateRange] = useState("week");

  const handleGenerateReport = () => {
    // Mock report generation
    console.log("Generating report:", { reportType, dateRange });
    // In a real app, this would call an API to generate the report
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <>
      <Button onClick={() => onOpenChange(true)}>Generate Custom Report</Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Custom Report</DialogTitle>
            <DialogDescription>
              Configure the parameters for your custom report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reportType" className="text-right">
                Report Type
              </label>
              <div className="col-span-3">
                <Select 
                  value={reportType} 
                  onValueChange={setReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="demographics">Demographics</SelectItem>
                    <SelectItem value="classes">Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="dateRange" className="text-right">
                Date Range
              </label>
              <div className="col-span-3">
                <Select 
                  value={dateRange} 
                  onValueChange={setDateRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportGenerator;

