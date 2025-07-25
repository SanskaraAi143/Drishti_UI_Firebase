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
  role: 'Security' | 'Medical' | 'Operations';
  location: Location;
  avatar: string;
  status: 'Patrolling' | 'Responding' | 'On-Break';
};

export type Incident = Alert;

export type MapLayers = {
  heatmap: boolean;
  staff: boolean;
  incidents: boolean;
  bottlenecks: boolean;
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  isLoading?: boolean;
};

export type Camera = {
  id: string;
  name: string;
  location: string;
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
