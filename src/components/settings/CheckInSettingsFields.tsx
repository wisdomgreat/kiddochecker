
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";

interface CheckInSettingsFieldsProps {
  form: UseFormReturn<GeneralSettingsFormValues>;
}

export function CheckInSettingsFields({ form }: CheckInSettingsFieldsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        control={form.control}
        name="checkInWindow"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Check-in Window (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              How many minutes before service starts can people check in?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sessionLength"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Session Length (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              Average length of a service or class session.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

