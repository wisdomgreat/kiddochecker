
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";

interface CheckInPolicyFieldsProps {
  form: UseFormReturn<GeneralSettingsFormValues>;
}

export function CheckInPolicyFields({ form }: CheckInPolicyFieldsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        control={form.control}
        name="allowLateCheckIn"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox 
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Allow Late Check-ins</FormLabel>
              <FormDescription>
                Permit check-ins after service has started.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="allowEarlyCheckOut"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox 
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Allow Early Check-outs</FormLabel>
              <FormDescription>
                Permit check-outs before service ends.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

