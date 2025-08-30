/**
 * FEATURE FLAGS CONFIGURATION
 * 
 * Centralized feature flag management for the application
 * Supports environment-based flags and runtime toggles
 */

export interface FeatureFlags {
  // Import system enhancements
  IMPORT_CSV_XML_JSON_XLSX: boolean;
  
  // Future flags can be added here
  // ADVANCED_ANALYTICS: boolean;
  // AI_LEAD_SCORING: boolean;
}

// Default feature flag values
const DEFAULT_FLAGS: FeatureFlags = {
  IMPORT_CSV_XML_JSON_XLSX: true,
};

/**
 * Get feature flag value from environment or default
 */
function getEnvFlag(key: keyof FeatureFlags, defaultValue: boolean): boolean {
  const envValue = process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
  
  if (envValue === undefined) {
    return defaultValue;
  }
  
  // Handle various truthy values
  return envValue.toLowerCase() === 'true' || envValue === '1';
}

/**
 * Runtime feature flags configuration
 * Reads from environment variables with fallback to defaults
 */
export const featureFlags: FeatureFlags = {
  IMPORT_CSV_XML_JSON_XLSX: getEnvFlag('IMPORT_CSV_XML_JSON_XLSX', DEFAULT_FLAGS.IMPORT_CSV_XML_JSON_XLSX),
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

/**
 * Helper for React components to conditionally render features
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return isFeatureEnabled(flag);
}

/**
 * Development helper to log current feature flag status
 */
export function logFeatureFlags() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚩 Active Feature Flags:', featureFlags);
  }
}

// Log feature flags in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logFeatureFlags();
}