import { OrganizationSettings } from "@/hooks/useSettings";

export interface ScreeningResult {
  isValid: boolean;
  error?: string;
  isSoftLimitTriggered?: boolean;
}

/**
 * Screens a file based on organization settings.
 * Mirrored after Windows Server FSRM (File Server Resource Manager)
 */
export const screenFileUpload = (
  file: File, 
  settings?: OrganizationSettings
): ScreeningResult => {
  if (!settings) return { isValid: true };

  const {
    max_upload_size_kb = 200,
    upload_limit_type = 'hard',
    blocked_extensions = ['exe', 'bat', 'sh']
  } = settings;

  // 1. Extension Check (File Screening)
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (blocked_extensions.includes(ext)) {
    return { 
      isValid: false, 
      error: `Security Violation: File type .${ext} is blocked by administrative policy.` 
    };
  }

  // 2. Quota Check
  const fileSizeKb = file.size / 1024;
  if (fileSizeKb > max_upload_size_kb) {
    if (upload_limit_type === 'hard') {
      return { 
        isValid: false, 
        error: `Quota Exceeded: File size (${Math.round(fileSizeKb)}KB) exceeds the administrative limit of ${max_upload_size_kb}KB.` 
      };
    } else {
      // Soft Limit: Valid but marked
      return { 
        isValid: true, 
        isSoftLimitTriggered: true,
        error: `Soft Quota Warning: File size exceeds the ${max_upload_size_kb}KB threshold, but is allowed by policy.`
      };
    }
  }

  return { isValid: true };
};

