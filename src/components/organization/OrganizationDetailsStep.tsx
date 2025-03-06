
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface OrganizationDetailsStepProps {
  form: UseFormReturn<any>;
  logoPreview: string | null;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}

export const OrganizationDetailsStep = ({
  form,
  logoPreview,
  handleLogoChange,
  onNext
}: OrganizationDetailsStepProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="organizationName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter your church or organization name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-2">
        <FormLabel>Organization Logo</FormLabel>
        <div className="flex items-center gap-4">
          {logoPreview && (
            <div className="w-24 h-24 border rounded-md overflow-hidden">
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex-1">
            <label 
              htmlFor="logo-upload" 
              className="flex items-center justify-center gap-2 w-full h-12 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Upload size={18} />
              <span>Upload Logo</span>
            </label>
            <input 
              id="logo-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="button" onClick={onNext}>
          Next: Admin Account
        </Button>
      </div>
    </div>
  );
};
