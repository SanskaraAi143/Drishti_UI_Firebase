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

const StaffMarker = ({ staffMember, map }: { staffMember: Staff, map: google.maps.Map | null }) => {
  if (!map) return null;
  return (
    <AdvancedMarker map={map} position={staffMember.location} title={staffMember.name}>
        <Avatar className="border-2 border-blue-400">
            <AvatarImage src={staffMember.avatar} alt={staffMember.name} data-ai-hint="person portrait" />
            <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
        </Avatar>
    </AdvancedMarker>
  );
};

const IncidentMarker = ({ incident, onClick, map }: { incident: Incident; onClick: (incident: Incident) => void, map: google.maps.Map | null }) => {
  if (!map) return null;
  return (
    <AdvancedMarker
      map={map}
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


const BengaluruMarker = ({map}: {map: google.maps.Map | null}) => {
    const [infoWindowShown, setInfoWindowShown] = React.useState(false);
    
    if (!map) return null;

    const position = { lat: 12.9716, lng: 77.5946 };

    return (
        <>
            <AdvancedMarker
                map={map}
                position={position}
                onClick={() => {
                    setInfoWindowShown(isShown => !isShown)
                    map.panTo(position);
                }}
            >
                <Pin />
            </AdvancedMarker>
            {infoWindowShown && (
                <InfoWindow
                    map={map}
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

const MapContent = ({ center, zoom, staff, incidents, layers, onIncidentClick }: MapViewProps) => {
  const map = useMap();

  return (
    <>
      <BengaluruMarker map={map} />
      
      {layers.staff && staff.map(s => <StaffMarker key={`staff-${s.id}`} staffMember={s} map={map} />)}

      {layers.incidents && incidents.map(i => <IncidentMarker key={`incident-${i.id}`} incident={i} onClick={onIncidentClick} map={map} />)}

      <MapLayersComponent layers={layers} staff={staff} incidents={incidents} />
    </>
  )
}


export default function MapView({ center, zoom, staff, incidents, layers, onIncidentClick }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive font-semibold text-lg">Google Maps API Key is Missing</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
            To display the map, you need to provide a Google Maps API key. Please create a `.env.local` file in the root of your project and add the following line:
        </p>
        <pre className="mt-4 bg-card p-2 rounded-md text-sm">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
        </pre>
        <p className="text-xs text-muted-foreground mt-4">
          Ensure the Maps JavaScript API is enabled for your key in the Google Cloud Console.
        </p>
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
              <MapContent
                center={center}
                zoom={zoom}
                staff={staff}
                incidents={incidents}
                layers={layers}
                onIncidentClick={onIncidentClick}
              />
          </Map>
      </div>
    </APIProvider>
  );
}
