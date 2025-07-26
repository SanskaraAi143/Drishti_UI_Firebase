export type Location = {
  lat: number;
  lng: number;
};

export type Alert = {
  id: string;
  type: 'CrowdSurge' | 'Altercation' | 'Medical' | 'UnattendedObject';
  description: string;
  timestamp: Date;
  location: Location;
  severity: 'Low' | 'Medium' | 'High';
  source: string;
};

export type Staff = {
  id: string;
  name: string;
  role: 'Commander' | 'Security' | 'Medical' | 'Operations';
  location: Location;
  avatar: string;
  status: 'Patrolling' | 'Responding' | 'On-Break' | 'Monitoring';
  route: google.maps.DirectionsResult | null;
};

export type Incident = Alert;

export type MapLayers = {
  heatmap: boolean;
  staff: boolean;
  incidents: boolean;
  cameras: boolean;
  bottlenecks: boolean;
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  isLoading?: boolean;
  incidents?: Incident[];
};

export type Camera = {
  id: string;
  name: string;
  location: Location;
  streamUrl: string;
};

export type LostAndFoundPerson = {
    id: string;
    name?: string;
    photoUrl: string;
    lastSeenLocation: string;
    lastSeenTime: Date;
    status: 'Searching' | 'Found' | 'Not Found';
};

export type Route = {
  distance: string;
  duration: string;
  steps: {
    instructions: string;
    distance: string;
    duration: string;
  }[];
  googleMapsUrl: string;
};

// Enhanced types for better validation
export type EventType = 
  | 'political-rally'
  | 'music-festival'
  | 'sporting-event'
  | 'parade'
  | 'public-protest'
  | 'corporate-event'
  | 'other';

export type EventSentiment = 
  | 'celebratory'
  | 'neutral'
  | 'controversial'
  | 'high-tension';

export type SecurityConcern = 
  | 'crowdControl'
  | 'medical'
  | 'targetedThreat'
  | 'externalAgitators'
  | 'perimeterBreach';

export type PlanData = {
  eventName: string;
  eventType: EventType;
  venueAddress: string;
  geofence: Location[] | null;
  peakAttendance: number;
  vipPresence: boolean;
  vipDetails?: string;
  eventSentiment: EventSentiment;
  securityConcerns: SecurityConcern[];
};

export type AssetType = 
  | 'fixed-camera'
  | 'ptz-camera'
  | 'barricade'
  | 'entrance'
  | 'command-post'
  | 'first-aid'
  | 'ambulance-staging';

export type PlacedAsset = {
  id: string;
  type: AssetType;
  label: string;
  notes: string;
  location: Location;
};

// API Response types
export type APIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Form validation types
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// Component prop types
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Environment configuration type
export type AppConfig = {
  googleMapsApiKey?: string;
  geminiApiKey?: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

// Enhanced error types
export type AppErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'CONFIG_ERROR'
  | 'STORAGE_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR';

export type AppError = {
  code: AppErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
};
