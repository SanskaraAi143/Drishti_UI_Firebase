'use client';

import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
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
    const visualizationLibrary = useMapsLibrary('visualization');
    const [heatmap, setHeatmap] = React.useState<google.maps.visualization.HeatmapLayer | null>(null);

    React.useEffect(() => {
        if (!map || !visualizationLibrary) return;

        if (!heatmap) {
            const heatmapData = incidents.map(incident => new google.maps.LatLng(incident.location.lat, incident.location.lng));
            const newHeatmap = new visualizationLibrary.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 40
            });
            setHeatmap(newHeatmap);
        } else {
            const heatmapData = incidents.map(incident => new google.maps.LatLng(incident.location.lat, incident.location.lng));
            heatmap.setData(heatmapData);
        }

    }, [map, visualizationLibrary, incidents, heatmap]);
    
    React.useEffect(() => {
        if(heatmap) {
            heatmap.setMap(layers.heatmap ? map : null);
        }
    }, [layers.heatmap, heatmap, map])
    
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
