
import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  FileText, 
  Settings, 
  Users, 
  Tag, 
  Check, 
  BarChart, 
  PieChart, 
  LineChart, 
  FileChart, 
  Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ReportGeneratorProps {
  onClose: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [reportType, setReportType] = useState<string>("attendance");
  const [reportName, setReportName] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("last30days");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [format, setFormat] = useState<string>("pdf");
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [selectedChart, setSelectedChart] = useState<string>("bar");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const availableClasses = [
    { id: "c1", name: "Toddlers (2-3 years)" },
    { id: "c2", name: "Pre-K (3-4 years)" },
    { id: "c3", name: "Kindergarten (4-5 years)" },
    { id: "c4", name: "Elementary (6-8 years)" },
    { id: "c5", name: "Middle School (9-12 years)" },
    { id: "c6", name: "High School (13-18 years)" },
  ];

  const handleClassSelection = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      generateReport();
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const generateReport = () => {
    if (!reportName.trim()) {
      toast.error("Please provide a report name");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report generated successfully!");
      onClose();
    }, 2000);
  };

  return (
    <Card className="p-6 w-full max-w-4xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Generate New Report</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X size={18} />
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeStep >= step
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 w-10 self-center ${
                      activeStep > step ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            Step {activeStep} of 3
          </div>
        </div>
      </div>

      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter a name for your report"
            />
          </div>

          <div className="space-y-2">
            <Label>Report Type</Label>
            <RadioGroup value={reportType} onValueChange={setReportType} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attendance" id="attendance" />
                <Label htmlFor="attendance" className="flex items-center cursor-pointer">
                  <FileText size={18} className="mr-2 text-blue-500" />
                  Attendance Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="progress" id="progress" />
                <Label htmlFor="progress" className="flex items-center cursor-pointer">
                  <BarChart size={18} className="mr-2 text-green-500" />
                  Progress Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="financial" id="financial" />
                <Label htmlFor="financial" className="flex items-center cursor-pointer">
                  <PieChart size={18} className="mr-2 text-purple-500" />
                  Financial Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex items-center cursor-pointer">
                  <Settings size={18} className="mr-2 text-orange-500" />
                  Custom Report
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <RadioGroup value={dateRange} onValueChange={setDateRange} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last7days" id="last7days" />
                <Label htmlFor="last7days" className="cursor-pointer">Last 7 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last30days" id="last30days" />
                <Label htmlFor="last30days" className="cursor-pointer">Last 30 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last90days" id="last90days" />
                <Label htmlFor="last90days" className="cursor-pointer">Last 90 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="customDate" />
                <Label htmlFor="customDate" className="cursor-pointer">Custom range</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Classes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {availableClasses.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cls.id}
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={() => handleClassSelection(cls.id)}
                  />
                  <Label htmlFor={cls.id} className="cursor-pointer">
                    {cls.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Include Charts</Label>
              <Checkbox
                id="includeCharts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
              />
            </div>
            
            {includeCharts && (
              <div className="mt-4">
                <Label>Chart Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div
                    className={`border rounded-md p-3 flex flex-col items-center ${
                      selectedChart === "bar" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedChart("bar")}
                  >
                    <BarChart className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm">Bar Chart</span>
                  </div>
                  <div
                    className={`border rounded-md p-3 flex flex-col items-center ${
                      selectedChart === "line" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedChart("line")}
                  >
                    <LineChart className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm">Line Chart</span>
                  </div>
                  <div
                    className={`border rounded-md p-3 flex flex-col items-center ${
                      selectedChart === "pie" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedChart("pie")}
                  >
                    <PieChart className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm">Pie Chart</span>
                  </div>
                  <div
                    className={`border rounded-md p-3 flex flex-col items-center ${
                      selectedChart === "combo" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedChart("combo")}
                  >
                    <FileChart className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm">Combination</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Report Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                  <FileText size={18} className="mr-2 text-red-500" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center cursor-pointer">
                  <FileText size={18} className="mr-2 text-green-500" />
                  Excel Spreadsheet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center cursor-pointer">
                  <FileText size={18} className="mr-2 text-blue-500" />
                  CSV File
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Report Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Report Name:</div>
              <div>{reportName || "Untitled Report"}</div>
              
              <div className="text-gray-500">Report Type:</div>
              <div className="flex items-center">
                {reportType === "attendance" && <FileText size={16} className="mr-1 text-blue-500" />}
                {reportType === "progress" && <BarChart size={16} className="mr-1 text-green-500" />}
                {reportType === "financial" && <PieChart size={16} className="mr-1 text-purple-500" />}
                {reportType === "custom" && <Settings size={16} className="mr-1 text-orange-500" />}
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </div>
              
              <div className="text-gray-500">Date Range:</div>
              <div>
                {dateRange === "last7days" && "Last 7 days"}
                {dateRange === "last30days" && "Last 30 days"}
                {dateRange === "last90days" && "Last 90 days"}
                {dateRange === "custom" && "Custom range"}
              </div>
              
              <div className="text-gray-500">Classes:</div>
              <div>{selectedClasses.length} selected</div>
              
              <div className="text-gray-500">Include Charts:</div>
              <div>{includeCharts ? "Yes" : "No"}</div>
              
              {includeCharts && (
                <>
                  <div className="text-gray-500">Chart Type:</div>
                  <div>
                    {selectedChart === "bar" && "Bar Chart"}
                    {selectedChart === "line" && "Line Chart"}
                    {selectedChart === "pie" && "Pie Chart"}
                    {selectedChart === "combo" && "Combination Chart"}
                  </div>
                </>
              )}
              
              <div className="text-gray-500">Format:</div>
              <div>
                {format === "pdf" && "PDF Document"}
                {format === "excel" && "Excel Spreadsheet"}
                {format === "csv" && "CSV File"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {activeStep > 1 ? (
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={handleNext}
          disabled={isGenerating}
        >
          {isGenerating && <RefreshCw size={16} className="mr-2 animate-spin" />}
          {activeStep < 3 ? "Next" : "Generate Report"}
        </Button>
      </div>
    </Card>
  );
};

export default ReportGenerator;
