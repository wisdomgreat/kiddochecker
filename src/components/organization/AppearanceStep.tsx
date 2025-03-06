
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface AppearanceStepProps {
  form: UseFormReturn<any>;
  onBack: () => void;
  isSubmitting: boolean;
}

export const AppearanceStep = ({
  form,
  onBack,
  isSubmitting
}: AppearanceStepProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="primaryColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Color</FormLabel>
            <div className="flex gap-3">
              <Input type="color" {...field} className="w-14 h-14 p-1 cursor-pointer" />
              <Input value={field.value} onChange={field.onChange} className="flex-1" />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="fontFamily"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Font Family</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="pt-6 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? "Setting up..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
};
