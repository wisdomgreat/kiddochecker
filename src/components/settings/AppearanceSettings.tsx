
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
    { value: "purple", label: "Purple", color: "bg-purple-600", primaryColor: "#8B5CF6" },
    { value: "blue", label: "Blue", color: "bg-blue-600", primaryColor: "#3b82f6" },
    { value: "green", label: "Green", color: "bg-green-600", primaryColor: "#22c55e" },
    { value: "orange", label: "Orange", color: "bg-orange-600", primaryColor: "#f97316" },
  ];

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

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("themeSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings) as ThemeSettings;
        form.reset(settings);
        setSelectedColor(settings.colorScheme);
        
        // Apply saved settings immediately on load
        applyThemeSettings(settings);
      }
    } catch (error) {
      console.error("Error loading theme settings", error);
    }
  }, []);

  // Function to apply theme settings
  const applyThemeSettings = (settings: ThemeSettings) => {
    console.log("Applying theme settings:", settings);
    // Apply theme (light/dark/system)
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (settings.theme === "dark" || (settings.theme === "system" && prefersDark)) {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    
    // Apply system theme listener if needed
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add("dark");
          document.body.classList.add("dark");
        } else {
          root.classList.remove("dark");
          document.body.classList.remove("dark");
        }
      };
      
      // Clean up old listener if exists
      try {
        mediaQuery.removeEventListener("change", handleChange);
      } catch(e) {
        console.log("No previous listener to remove");
      }
      mediaQuery.addEventListener("change", handleChange);
    }
    
    // Apply color scheme
    const colorOption = colorOptions.find(c => c.value === settings.colorScheme);
    if (colorOption) {
      document.documentElement.style.setProperty("--color-primary", colorOption.primaryColor);
      
      // Convert hex to HSL for CSS variables
      const hslColor = hexToHSL(colorOption.primaryColor);
      if (hslColor) {
        document.documentElement.style.setProperty("--primary", `${hslColor.h} ${hslColor.s}% ${hslColor.l}%`);
      }
    }
    
    // Apply accessibility settings
    applyAccessibilitySettings(settings);
  };
  
  // Apply accessibility-specific settings
  const applyAccessibilitySettings = (settings: ThemeSettings) => {
    const { highContrast, largeText, animations } = settings;
    const root = document.documentElement;
    
    // High contrast mode
    if (highContrast) {
      root.classList.add("high-contrast");
      document.body.classList.add("high-contrast");
      applyHighContrastStyles();
    } else {
      root.classList.remove("high-contrast");
      document.body.classList.remove("high-contrast");
      removeHighContrastStyles();
    }
    
    // Large text mode
    if (largeText) {
      root.classList.add("large-text");
      document.body.classList.add("text-lg");
      applyLargeTextStyles();
    } else {
      root.classList.remove("large-text");
      document.body.classList.remove("text-lg");
      removeLargeTextStyles();
    }
    
    // Animations
    if (!animations) {
      root.classList.add("reduce-motion");
      document.body.classList.add("reduce-motion");
      applyReduceMotionStyles();
    } else {
      root.classList.remove("reduce-motion");
      document.body.classList.remove("reduce-motion");
      removeReduceMotionStyles();
    }
  };
  
  // Style management functions
  const applyHighContrastStyles = () => {
    let styleEl = document.getElementById('high-contrast-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'high-contrast-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .high-contrast {
        --background: #000000;
        --foreground: #ffffff;
        --muted: #444444;
        --muted-foreground: #eeeeee;
        --border: #ffffff;
        --input: #333333;
      }
      .high-contrast p, .high-contrast h1, .high-contrast h2, .high-contrast h3, 
      .high-contrast h4, .high-contrast span, .high-contrast div {
        color: #ffffff;
      }
      .high-contrast .card {
        background-color: #222222;
        border: 1px solid #ffffff;
      }
      .high-contrast button {
        border: 2px solid white;
      }
      .high-contrast input, .high-contrast select {
        background-color: #333333;
        color: white;
        border: 1px solid white;
      }
    `;
  };
  
  const removeHighContrastStyles = () => {
    const styleEl = document.getElementById('high-contrast-styles');
    if (styleEl) {
      styleEl.textContent = '';
    }
  };
  
  const applyLargeTextStyles = () => {
    let styleEl = document.getElementById('large-text-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'large-text-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .large-text {
        font-size: 18px;
      }
      .large-text h1 {
        font-size: 2.5rem;
      }
      .large-text h2 {
        font-size: 2rem;
      }
      .large-text h3 {
        font-size: 1.75rem;
      }
      .large-text button, .large-text input, .large-text select {
        font-size: 1.1rem;
      }
    `;
  };
  
  const removeLargeTextStyles = () => {
    const styleEl = document.getElementById('large-text-styles');
    if (styleEl) {
      styleEl.textContent = '';
    }
  };
  
  const applyReduceMotionStyles = () => {
    let styleEl = document.getElementById('reduce-motion-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'reduce-motion-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .reduce-motion * {
        transition: none !important;
        animation: none !important;
      }
    `;
  };
  
  const removeReduceMotionStyles = () => {
    const styleEl = document.getElementById('reduce-motion-styles');
    if (styleEl) {
      styleEl.textContent = '';
    }
  };
  
  // Convert hex color to HSL for CSS variables
  const hexToHSL = (hex: string): { h: number; s: number; l: number } | null => {
    try {
      // Remove the # if it exists
      hex = hex.replace(/^#/, '');
      
      // Parse the hex values
      let r = parseInt(hex.substring(0, 2), 16) / 255;
      let g = parseInt(hex.substring(2, 4), 16) / 255;
      let b = parseInt(hex.substring(4, 6), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      let l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        
        h *= 60;
      }
      
      // Round values
      h = Math.round(h);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return { h, s, l };
    } catch (error) {
      console.error("Error converting hex to HSL:", error);
      return null;
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("Saving appearance settings:", values);
      // Save settings to localStorage
      const themeSettings: ThemeSettings = {
        theme: values.theme,
        colorScheme: values.colorScheme,
        highContrast: values.highContrast,
        largeText: values.largeText,
        animations: values.animations
      };
      
      localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
      
      // Apply the theme settings
      applyThemeSettings(themeSettings);
      
      toast({
        title: "Appearance updated",
        description: "Your appearance settings have been saved and applied.",
      });
    } catch (error) {
      console.error("Error saving theme settings:", error);
      toast({
        title: "Error",
        description: "Failed to save appearance settings.",
        variant: "destructive",
      });
    }
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
                      onValueChange={(value) => {
                        console.log("Theme changed to:", value);
                        field.onChange(value);
                        // Preview theme change immediately
                        const currentSettings = form.getValues();
                        applyThemeSettings({
                          theme: value as "light" | "dark" | "system",
                          colorScheme: currentSettings.colorScheme,
                          highContrast: currentSettings.highContrast,
                          largeText: currentSettings.largeText,
                          animations: currentSettings.animations
                        });
                      }}
                      value={field.value}
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
                          console.log("Color scheme changed to:", option.value);
                          field.onChange(option.value);
                          setSelectedColor(option.value);
                          
                          // Preview color change immediately
                          const currentSettings = form.getValues();
                          // Ensure we're using a type-safe value for colorScheme
                          const typeSafeColorScheme = option.value as "purple" | "blue" | "green" | "orange";
                          applyThemeSettings({
                            theme: currentSettings.theme,
                            colorScheme: typeSafeColorScheme,
                            highContrast: currentSettings.highContrast,
                            largeText: currentSettings.largeText,
                            animations: currentSettings.animations
                          });
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
                      onCheckedChange={(checked) => {
                        console.log("High contrast changed to:", checked);
                        field.onChange(checked);
                        
                        // Preview contrast change immediately
                        const currentSettings = form.getValues();
                        applyThemeSettings({
                          theme: currentSettings.theme,
                          colorScheme: currentSettings.colorScheme,
                          highContrast: checked,
                          largeText: currentSettings.largeText,
                          animations: currentSettings.animations
                        });
                      }}
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
                      onCheckedChange={(checked) => {
                        console.log("Large text changed to:", checked);
                        field.onChange(checked);
                        
                        // Preview text size change immediately
                        const currentSettings = form.getValues();
                        applyThemeSettings({
                          theme: currentSettings.theme,
                          colorScheme: currentSettings.colorScheme,
                          highContrast: currentSettings.highContrast,
                          largeText: checked,
                          animations: currentSettings.animations
                        });
                      }}
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
                      onCheckedChange={(checked) => {
                        console.log("Animations changed to:", checked);
                        field.onChange(checked);
                        
                        // Preview animation change immediately
                        const currentSettings = form.getValues();
                        applyThemeSettings({
                          theme: currentSettings.theme,
                          colorScheme: currentSettings.colorScheme,
                          highContrast: currentSettings.highContrast,
                          largeText: currentSettings.largeText,
                          animations: checked
                        });
                      }}
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
