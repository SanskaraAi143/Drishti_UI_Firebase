'use client';

import { useState, useEffect } from 'react';
import MapView from './map-view';
import type { Location, Staff, Incident, MapLayers, Route, Camera } from '@/lib/types';

interface ClientOnlyMapProps {
  center: Location;
  zoom: number;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  incidents: Incident[];
  cameras: Camera[];
  layers: MapLayers;
  patrolRoute: Location[];
  onIncidentClick: (incident: Incident) => void;
  onCameraClick: (camera: Camera) => void;
  onCameraMove: (cameraId: string, newLocation: Location) => void;
  onMapInteraction: (center: Location, zoom: number) => void;
  incidentDirections: google.maps.DirectionsResult | null;
  onIncidentDirectionsChange: (result: google.maps.DirectionsResult | null, route: Route | null) => void;
  isIncidentRouteActive: boolean;
}

export default function ClientOnlyMap(props: ClientOnlyMapProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p>Loading Map...</p>
      </div>
    );
  }

  return <MapView {...props} />;
}
