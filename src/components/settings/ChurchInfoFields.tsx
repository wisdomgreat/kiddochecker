
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";

interface ChurchInfoFieldsProps {
  form: UseFormReturn<GeneralSettingsFormValues>;
}

export function ChurchInfoFields({ form }: ChurchInfoFieldsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        control={form.control}
        name="churchName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Church Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter church name" {...field} />
            </FormControl>
            <FormDescription>
              This name will appear on all check-in materials.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="timeZone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Zone</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "America/New_York"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Used for scheduling and reporting.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
