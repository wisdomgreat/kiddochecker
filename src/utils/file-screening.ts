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

  try {
    const rawBlocked = settings.blocked_extensions;
    let blockedList: string[] = ['exe', 'bat', 'sh', 'php', 'js', 'py', 'cmd', 'vbs', 'msi', 'com'];

    if (Array.isArray(rawBlocked)) {
      blockedList = rawBlocked.map(e => String(e).toLowerCase().replace(/^\./, ''));
    } else if (typeof rawBlocked === 'string') {
      const clean = rawBlocked.replace(/^\{|\}$/g, '');
      blockedList = clean.split(',').map(e => e.trim().toLowerCase().replace(/^\./, '')).filter(Boolean);
    }

    // 1. Extension Check (File Screening)
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (blockedList.includes(ext)) {
      return { 
        isValid: false, 
        error: `Security Violation: File type .${ext} is blocked by administrative policy.` 
      };
    }

    // 2. Quota Check
    const maxSizeKb = Number(settings.max_upload_size_kb) || 200;
    const uploadLimitType = settings.upload_limit_type || 'hard';
    const fileSizeKb = file.size / 1024;

    if (fileSizeKb > maxSizeKb) {
      if (uploadLimitType === 'hard') {
        return { 
          isValid: false, 
          error: `Quota Exceeded: File size (${Math.round(fileSizeKb)}KB) exceeds the administrative limit of ${maxSizeKb}KB.` 
        };
      } else {
        // Soft Limit: Valid but marked
        return { 
          isValid: true, 
          isSoftLimitTriggered: true,
          error: `Soft Quota Warning: File size exceeds the ${maxSizeKb}KB threshold, but is allowed by policy.`
        };
      }
    }

    return { isValid: true };
  } catch (err: any) {
    console.warn('[screenFileUpload] Error during screening, falling back to safe defaults:', err.message);
    return { isValid: true };
  }
};

