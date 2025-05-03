
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Filter, Download, UserPlus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UserActionButtons = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddUserClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleExportClick = () => {
    try {
      // Get the table data
      const tableElement = document.querySelector(".data-table");
      if (!tableElement) {
        throw new Error("Table not found");
      }
      
      // Extract table rows and headers
      const rows = Array.from(tableElement.querySelectorAll("tbody tr"));
      const headers = Array.from(tableElement.querySelectorAll("thead th")).map(
        th => th.textContent
      );
      
      // Create CSV content
      let csvContent = headers.join(",") + "\n";
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        const rowData = cells.map(cell => {
          // Get only text content, remove any HTML
          const text = cell.textContent || "";
          // Escape quotes and wrap in quotes if contains comma
          return text.includes(",") ? `"${text.replace(/"/g, '""')}"` : text;
        });
        csvContent += rowData.join(",") + "\n";
      });
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "users_export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ 
        title: "Export successful", 
        description: "Users data has been exported to CSV" 
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({ 
        title: "Export failed", 
        description: "There was an error exporting users data", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm">
        <Filter className="mr-1 h-4 w-4" />
        Filter
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportClick}>
        <Download className="mr-1 h-4 w-4" />
        Export
      </Button>
      <Button onClick={handleAddUserClick}>
        <UserPlus className="mr-1 h-4 w-4" />
        Add User
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>User creation functionality will be available soon. This feature is currently being implemented.</p>
            <p>In the meantime, you can add users directly through the Supabase dashboard.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserActionButtons;
