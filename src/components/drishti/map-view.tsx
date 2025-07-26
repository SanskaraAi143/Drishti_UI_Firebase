'use client';

import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import type { Location, Staff, Incident, MapLayers } from '@/lib/types';
import { IncidentIcon } from '../icons/incident-icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const severityColors = {
  High: '#ef4444',
  Medium: '#f97316',
  Low: '#3b82f6',
};

interface MapViewProps {
  center: Location;
  zoom: number;
  staff: Staff[];
  incidents: Incident[];
  layers: MapLayers;
  onIncidentClick: (incident: Incident) => void;
}

const StaffMarker = ({ staffMember }: { staffMember: Staff }) => {
  return (
    <AdvancedMarker position={staffMember.location} title={staffMember.name}>
        <Avatar className="border-2 border-blue-400">
            <AvatarImage src={staffMember.avatar} alt={staffMember.name} data-ai-hint="person portrait" />
            <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
        </Avatar>
    </AdvancedMarker>
  );
};

const IncidentMarker = ({ incident, onClick }: { incident: Incident; onClick: (incident: Incident) => void }) => {
  return (
    <AdvancedMarker
      position={incident.location}
      title={`${incident.type} Incident (${incident.severity})`}
      onClick={() => onClick(incident)}
    >
      <div className="relative">
          <IncidentIcon
              type={incident.type}
              className="h-8 w-8 p-1.5 rounded-full bg-background border-2"
              style={{ borderColor: severityColors[incident.severity] }}
              color={severityColors[incident.severity]}
          />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: severityColors[incident.severity] }}></span>
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: severityColors[incident.severity] }}></span>
          </span>
      </div>
    </AdvancedMarker>
  );
};


const BengaluruMarker = () => {
    const [infoWindowShown, setInfoWindowShown] = React.useState(false);
    const map = useMap();

    const position = { lat: 12.9716, lng: 77.5946 };

    return (
        <>
            <AdvancedMarker
                position={position}
                onClick={() => {
                    setInfoWindowShown(isShown => !isShown)
                    if(map) map.panTo(position);
                }}
            >
                <Pin />
            </AdvancedMarker>
            {infoWindowShown && (
                <InfoWindow
                    position={position}
                    onCloseClick={() => setInfoWindowShown(false)}
                >
                    <h2>Welcome to Bengaluru!</h2>
                    <p>The Garden City of India.</p>
                </InfoWindow>
            )}
        </>
    )
}


const MapLayersComponent = ({ layers, staff, incidents }: Pick<MapViewProps, 'layers' | 'staff' | 'incidents'>) => {
    const map = useMap();

    React.useEffect(() => {
        if (!map) return;
        
        // This is a placeholder for heatmap and bottleneck layers as @vis.gl/react-google-maps doesn't have direct equivalents.
        // For a production app, you would integrate a library like deck.gl for these overlays.
        console.log("Map layers updated:", layers);

    }, [map, layers, staff, incidents]);
    
    return null;
}


export default function MapView({ center, zoom, staff, incidents, layers, onIncidentClick }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center p-4 text-center">
        <p className="text-red-500 font-semibold">Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.</p>
        <p className="text-sm text-muted-foreground mt-2">This is a required configuration to display the map. Please refer to the Google Maps Platform documentation to get a key.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full">
          <Map
            defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
            defaultZoom={12}
            center={center}
            zoom={zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'drishti_dark_map'}
          >
              <BengaluruMarker/>

              {layers.staff && staff.map(s => <StaffMarker key={`staff-${s.id}`} staffMember={s} />)}

              {layers.incidents && incidents.map(i => <IncidentMarker key={`incident-${i.id}`} incident={i} onClick={onIncidentClick} />)}

              <MapLayersComponent layers={layers} staff={staff} incidents={incidents} />

          </Map>
      </div>
    </APIProvider>
  );
}