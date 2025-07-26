import { AppConfig, AppError } from './types';
import { getEnvVar } from './error-utils';

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export const validateAppConfig = (): AppConfig => {
  const config: AppConfig = {
    googleMapsApiKey: getEnvVar('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
    geminiApiKey: getEnvVar('GEMINI_API_KEY'),
    isDevelopment: getEnvVar('NODE_ENV') === 'development',
    isProduction: getEnvVar('NODE_ENV') === 'production',
  };

  return config;
};

export const validateRequiredConfig = (requiredKeys: (keyof AppConfig)[]): void => {
  const config = validateAppConfig();
  const missingKeys: string[] = [];

  requiredKeys.forEach(key => {
    if (!config[key]) {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    throw new ConfigValidationError(
      `Missing required configuration: ${missingKeys.join(', ')}`
    );
  }
};

export const getAppConfig = (): AppConfig => {
  try {
    return validateAppConfig();
  } catch (error) {
    console.error('Failed to validate app config:', error);
    // Return minimal config in case of error
    return {
      isDevelopment: true,
      isProduction: false,
    };
  }
};

// Environment-specific configuration checks
export const isGoogleMapsConfigured = (): boolean => {
  // On server side, assume it's configured to prevent hydration mismatch
  if (typeof window === 'undefined') {
    return true;
  }
  
  const config = getAppConfig();
  return !!config.googleMapsApiKey && config.googleMapsApiKey.length > 0;
};

export const isAiConfigured = (): boolean => {
  const config = getAppConfig();
  return !!config.geminiApiKey;
};

export const getGoogleMapsApiKey = (): string => {
  const config = getAppConfig();
  if (!config.googleMapsApiKey) {
    throw new ConfigValidationError('Google Maps API key is not configured');
  }
  return config.googleMapsApiKey;
};

export const getAiApiKey = (): string => {
  const config = getAppConfig();
  if (!config.geminiApiKey) {
    throw new ConfigValidationError('Gemini API key is not configured');
  }
  return config.geminiApiKey;
};
