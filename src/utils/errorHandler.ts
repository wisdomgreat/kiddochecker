
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Function to extract human-readable error messages from Supabase errors
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    if (error.code === '23505') {
      return 'This record already exists.';
    }
    
    if (error.code === '23503') {
      return 'This operation would violate data integrity. Please check related records.';
    }
    
    if (error.code === '42501') {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.message) {
      return error.message;
    }
  }
  
  return 'An unknown error occurred';
}

// Type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// Function to log errors to console for debugging
export function logError(context: string, error: unknown): void {
  console.error(`Error in ${context}:`, error);
  
  // In a production app, you might want to send this to a monitoring service
  // Example: sendToErrorMonitoring(context, error);
}

// Function to handle errors in UI components
export function handleUIError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  logError(context, error);
  
  toast({
    title: `Error in ${context}`,
    description: message,
    variant: "destructive",
  });
}

// Function to validate required fields in a form
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      return `The ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field is required`;
    }
  }
  
  return null;
}

// Function to standardize form validation
export function validateForm(data: Record<string, any>, validationRules: Record<string, (value: any) => string | null>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(validationRules)) {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
}
