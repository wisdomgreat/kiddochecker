
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { ThemeSettings } from "@/types/supabase";

const formSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  highContrast: z.boolean().default(false),
  largeText: z.boolean().default(false),
  animations: z.boolean().default(true),
  colorScheme: z.enum(["purple", "blue", "green", "orange"]),
});

type ColorOption = {
  value: string;
  label: string;
  color: string;
  primaryColor: string;
};

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string>("purple");

  const colorOptions: ColorOption[] = [
    { value: "purple", label: "Purple", color: "bg-purple-600", primaryColor: "#9b87f5" },
    { value: "blue", label: "Blue", color: "bg-blue-600", primaryColor: "#3b82f6" },
    { value: "green", label: "Green", color: "bg-green-600", primaryColor: "#22c55e" },
    { value: "orange", label: "Orange", color: "bg-orange-600", primaryColor: "#f97316" },
  ];

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("themeSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings) as ThemeSettings;
        form.reset(settings);
        setSelectedColor(settings.colorScheme);
        applyThemeSettings(settings);
      }
    } catch (error) {
      console.error("Error loading theme settings", error);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: "light",
      highContrast: false,
      largeText: false,
      animations: true,
      colorScheme: "purple",
    },
  });

  // Function to apply theme settings
  const applyThemeSettings = (settings: ThemeSettings) => {
    // Theme (light/dark)
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else if (settings.theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    
    // Color scheme
    const colorOption = colorOptions.find(c => c.value === settings.colorScheme);
    if (colorOption) {
      const style = document.documentElement.style;
      style.setProperty("--primary-color", colorOption.primaryColor);
      
      // Update button styles
      document.querySelectorAll('.btn-primary').forEach((el) => {
        (el as HTMLElement).style.backgroundColor = colorOption.primaryColor;
      });
    }
    
    // Text size
    if (settings.largeText) {
      root.classList.add("text-lg");
    } else {
      root.classList.remove("text-lg");
    }
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    
    // Animations
    if (!settings.animations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Save settings to localStorage
    localStorage.setItem("themeSettings", JSON.stringify(values));
    
    // Apply the theme settings
    applyThemeSettings(values);
    
    toast({
      title: "Appearance updated",
      description: "Your appearance settings have been saved.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <div className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:ring-1 [&:has([data-state=checked])>div]:ring-purple-600">
                            <RadioGroupItem value="light" id="light" className="sr-only" />
                            <div className="border-2 rounded-md p-4 flex flex-col items-center cursor-pointer hover:border-purple-200">
                              <Sun className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">Light</span>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <div className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:ring-1 [&:has([data-state=checked])>div]:ring-purple-600">
                            <RadioGroupItem value="dark" id="dark" className="sr-only" />
                            <div className="border-2 rounded-md p-4 flex flex-col items-center cursor-pointer hover:border-purple-200">
                              <Moon className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">Dark</span>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <div className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:ring-1 [&:has([data-state=checked])>div]:ring-purple-600">
                            <RadioGroupItem value="system" id="system" className="sr-only" />
                            <div className="border-2 rounded-md p-4 flex flex-col items-center cursor-pointer hover:border-purple-200">
                              <Monitor className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">System</span>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-center">
                    Select a theme preference for the application.
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Color Scheme</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="colorScheme"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {colorOptions.map((option) => (
                      <div 
                        key={option.value}
                        className={`flex flex-col items-center gap-2 cursor-pointer`}
                        onClick={() => {
                          field.onChange(option.value);
                          setSelectedColor(option.value);
                        }}
                      >
                        <div 
                          className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center transition-all ${
                            selectedColor === option.value ? 'ring-4 ring-purple-200' : ''
                          }`}
                        >
                          {selectedColor === option.value && (
                            <Check className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{option.label}</span>
                      </div>
                    ))}
                  </div>
                  <FormDescription className="text-center">
                    Choose a primary color for the application.
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="highContrast"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">High Contrast</FormLabel>
                    <FormDescription>
                      Increase contrast for better readability.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="largeText"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Large Text</FormLabel>
                    <FormDescription>
                      Increase the font size across the application.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="animations"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Animations</FormLabel>
                    <FormDescription>
                      Enable or disable UI animations.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Appearance Settings</Button>
        </div>
      </form>
    </Form>
  );
};

export default AppearanceSettings;
