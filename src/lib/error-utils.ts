// Error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleAsyncError = async <T>(
  fn: () => Promise<T>,
  errorMessage: string = 'An unexpected error occurred'
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return {
      error: new AppError(
        error instanceof Error ? error.message : errorMessage,
        'ASYNC_ERROR'
      )
    };
  }
};

export const handleSyncError = <T>(
  fn: () => T,
  errorMessage: string = 'An unexpected error occurred'
): { data?: T; error?: AppError } => {
  try {
    const data = fn();
    return { data };
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return {
      error: new AppError(
        error instanceof Error ? error.message : errorMessage,
        'SYNC_ERROR'
      )
    };
  }
};

// Local storage utilities with error handling
export const localStorage_getItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('localStorage.getItem failed:', error);
    return null;
  }
};

export const localStorage_setItem = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage.setItem failed:', error);
    return false;
  }
};

export const localStorage_removeItem = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('localStorage.removeItem failed:', error);
    return false;
  }
};

// JSON parsing with error handling
export const safeJsonParse = <T>(jsonString: string | null): T | null => {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON.parse failed:', error);
    return null;
  }
};

export const safeJsonStringify = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('JSON.stringify failed:', error);
    return null;
  }
};

// Validation utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>\"']/g, '');
};

// Environment variable helpers
export const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  // Handle both server and client environment variables
  if (typeof window === 'undefined') {
    // Server-side: Access all environment variables
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
  } else {
    // Client-side: Only access NEXT_PUBLIC_ prefixed variables
    if (key.startsWith('NEXT_PUBLIC_') && typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
  }
  return defaultValue;
};

export const getRequiredEnvVar = (key: string): string => {
  const value = getEnvVar(key);
  if (!value) {
    throw new AppError(`Required environment variable ${key} is not set`, 'ENV_VAR_MISSING');
  }
  return value;
};
