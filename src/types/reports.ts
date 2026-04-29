
// Define types for the Reports Dashboard
export type ReportType = "attendance" | "classes" | "demographics";
export type TimeRange = "day" | "week" | "month" | "quarter";

export interface ReportGeneratorProps {
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

// Chart colors for consistent styling
export const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];

