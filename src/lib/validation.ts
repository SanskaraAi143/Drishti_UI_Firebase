import { z } from 'zod';
import type { Location, PlanData, PlacedAsset } from './types';

// Basic validation schemas
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const EventTypeSchema = z.enum([
  'political-rally',
  'music-festival', 
  'sporting-event',
  'parade',
  'public-protest',
  'corporate-event',
  'other'
]);

export const EventSentimentSchema = z.enum([
  'celebratory',
  'neutral', 
  'controversial',
  'high-tension'
]);

export const SecurityConcernSchema = z.enum([
  'crowdControl',
  'medical',
  'targetedThreat', 
  'externalAgitators',
  'perimeterBreach'
]);

// Plan data validation
export const PlanDataSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters').max(100),
  eventType: EventTypeSchema,
  venueAddress: z.string().min(5, 'Venue address is required').max(200),
  geofence: z.array(LocationSchema).min(3, 'Geofence must have at least 3 points').nullable(),
  peakAttendance: z.number().min(1).max(1000000),
  vipPresence: z.boolean(),
  vipDetails: z.string().max(500).optional(),
  eventSentiment: EventSentimentSchema,
  securityConcerns: z.array(SecurityConcernSchema).min(1, 'Select at least one security concern'),
});

// Asset validation
export const AssetTypeSchema = z.enum([
  'fixed-camera',
  'ptz-camera',
  'barricade',
  'entrance',
  'command-post',
  'first-aid',
  'ambulance-staging'
]);

export const PlacedAssetSchema = z.object({
  id: z.string(),
  type: AssetTypeSchema,
  label: z.string().min(1).max(50),
  notes: z.string().max(200),
  location: LocationSchema,
});

// File validation
export const FileSchema = z.object({
  size: z.number().max(4 * 1024 * 1024, 'File must be smaller than 4MB'),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/webp'].includes(type),
    'File must be JPEG, PNG, or WebP'
  ),
});

// Form validation helpers
export const validatePlanData = (data: unknown): PlanData => {
  return PlanDataSchema.parse(data);
};

export const validateLocation = (data: unknown): Location => {
  return LocationSchema.parse(data);
};

export const validateAsset = (data: unknown): PlacedAsset => {
  return PlacedAssetSchema.parse(data);
};

// Input sanitization
export const sanitizeInput = {
  string: (input: string): string => {
    return input.trim().replace(/[<>\"'&]/g, '');
  },
  
  number: (input: string | number): number => {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
  },
  
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },
  
  url: (input: string): string => {
    return input.trim().toLowerCase();
  }
};

// Validation utilities
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const isValidGeofence = (points: Location[]): boolean => {
  if (points.length < 3) return false;
  return points.every(point => isValidCoordinate(point.lat, point.lng));
};

export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 4 * 1024 * 1024; // 4MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

// Form field validation
export const validateFormField = {
  eventName: (value: string): string | null => {
    if (!value.trim()) return 'Event name is required';
    if (value.length < 3) return 'Event name must be at least 3 characters';
    if (value.length > 100) return 'Event name must be less than 100 characters';
    return null;
  },
  
  venueAddress: (value: string): string | null => {
    if (!value.trim()) return 'Venue address is required';
    if (value.length < 5) return 'Please provide a complete venue address';
    if (value.length > 200) return 'Venue address is too long';
    return null;
  },
  
  peakAttendance: (value: number): string | null => {
    if (value < 1) return 'Peak attendance must be at least 1';
    if (value > 1000000) return 'Peak attendance cannot exceed 1,000,000';
    return null;
  },
  
  assetLabel: (value: string): string | null => {
    if (!value.trim()) return 'Asset label is required';
    if (value.length > 50) return 'Asset label must be less than 50 characters';
    return null;
  }
};

// Validation error formatting
export const formatValidationError = (error: z.ZodError): string => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
};

export const getFieldError = (error: z.ZodError, fieldName: string): string | null => {
  const fieldError = error.errors.find(err => err.path.includes(fieldName));
  return fieldError ? fieldError.message : null;
};
