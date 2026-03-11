
import { z } from "zod";

export const generalSettingsSchema = z.object({
  churchName: z.string().min(2, {
    message: "Church name must be at least 2 characters.",
  }),
  timeZone: z.string({
    required_error: "Please select a timezone.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  checkInWindow: z.string(),
  allowLateCheckIn: z.boolean().default(false),
  allowEarlyCheckOut: z.boolean().default(false),
  sessionLength: z.string(),
  logoUrl: z.string().optional(),
});

export type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export const defaultValues: GeneralSettingsFormValues = {
  churchName: "Grace Community Church",
  timeZone: "America/New_York",
  address: "123 Main St, Anytown, USA",
  checkInWindow: "15",
  allowLateCheckIn: true,
  allowEarlyCheckOut: false,
  sessionLength: "60",
  logoUrl: "",
};
