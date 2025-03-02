
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const childFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  age: z.coerce.number().min(0).max(18),
  allergies: z.string().optional(),
  medicalInfo: z.string().optional(),
  notes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export type ChildFormValues = z.infer<typeof childFormSchema>;

interface ChildRegistrationFormProps {
  onAddChild: (child: ChildFormValues) => void;
  registeredChildren: ChildFormValues[];
  onRemoveChild: (index: number) => void;
  familyName: string;
  onFamilyNameChange: (name: string) => void;
}

export const ChildRegistrationForm = ({
  onAddChild,
  registeredChildren,
  onRemoveChild,
  familyName,
  onFamilyNameChange,
}: ChildRegistrationFormProps) => {
  const [showForm, setShowForm] = useState(false);

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: undefined,
      allergies: "",
      medicalInfo: "",
      notes: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  const handleSubmit = (values: ChildFormValues) => {
    onAddChild(values);
    form.reset();
    setShowForm(false);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Family Information</h3>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="familyName">Family Name</Label>
          <Input 
            id="familyName" 
            value={familyName} 
            onChange={(e) => onFamilyNameChange(e.target.value)}
            placeholder="e.g. Smith Family"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Children</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowForm(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </div>

        {registeredChildren.length === 0 ? (
          <p className="text-sm text-gray-500">No children added yet. Add a child to continue.</p>
        ) : (
          <div className="grid gap-4">
            {registeredChildren.map((child, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">{child.firstName} {child.lastName}</p>
                  <p className="text-sm text-gray-500">Age: {child.age}</p>
                  {child.allergies && (
                    <p className="text-xs text-red-500">Allergies: {child.allergies}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveChild(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border border-blue-100 p-4 rounded-md bg-blue-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Age" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormControl>
                      <Input placeholder="List any allergies" {...field} />
                    </FormControl>
                    <FormDescription>
                      List any food or other allergies your child has
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="medicalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any medical conditions or medications" 
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes" 
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Child</Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ChildRegistrationForm;
