
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";

interface AddressFieldProps {
  form: UseFormReturn<GeneralSettingsFormValues>;
}

export function AddressField({ form }: AddressFieldProps) {
  return (
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Church Address</FormLabel>
          <FormControl>
            <Input placeholder="Enter church address" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

