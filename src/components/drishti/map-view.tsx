
'use client';

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Location, Staff, Incident, MapLayers, Route, Camera } from '@/lib/types';
import { IncidentIcon } from '../icons/incident-icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Video } from 'lucide-react';

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
  cameras: Camera[];
  layers: MapLayers;
  onIncidentClick: (incident: Incident) => void;
  onCameraClick: (camera: Camera) => void;
  onMapInteraction: (center: Location, zoom: number) => void;
  directionsRequest: google.maps.DirectionsRequest | null;
  onDirectionsChange: (result: google.maps.DirectionsResult | null, route: Route | null) => void;
}

const getRoleHint = (role: Staff['role']) => {
    switch(role) {
        case 'Commander': return 'commander portrait';
        default: return 'person portrait';
    }
}

const StaffMarker = ({ staffMember }: { staffMember: Staff }) => {
  return (
    <AdvancedMarker position={staffMember.location} title={staffMember.name}>
        <Avatar className="border-2 border-blue-400">
            <AvatarImage src={staffMember.avatar} alt={staffMember.name} data-ai-hint={getRoleHint(staffMember.role)} />
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
          {incident.severity === 'High' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: severityColors[incident.severity] }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: severityColors[incident.severity] }}></span>
            </span>
          )}
      </div>
    </AdvancedMarker>
  );
};

const CameraMarker = ({ camera, onClick }: { camera: Camera, onClick: (camera: Camera) => void }) => {
    return (
      <AdvancedMarker
        position={camera.location}
        title={camera.name}
        onClick={() => onClick(camera)}
      >
        <div className="p-1.5 rounded-full bg-background border-2 border-gray-500">
            <Video className="h-5 w-5 text-gray-500" />
        </div>
      </AdvancedMarker>
    );
  };

const MapLayersComponent = ({ layers, incidents }: Pick<MapViewProps, 'layers' | 'incidents'>) => {
    const map = useMap();
    const visualizationLibrary = useMapsLibrary('visualization');
    const [heatmap, setHeatmap] = React.useState<google.maps.visualization.HeatmapLayer | null>(null);

    React.useEffect(() => {
        if (!map || !visualizationLibrary) return;

        if (!heatmap) {
            const newHeatmap = new visualizationLibrary.HeatmapLayer({
                data: [],
                map: map,
                radius: 40
            });
            setHeatmap(newHeatmap);
        }
        
        const heatmapData = incidents.map(incident => new google.maps.LatLng(incident.location.lat, incident.location.lng));
        heatmap?.setData(heatmapData);

    }, [map, visualizationLibrary, incidents, heatmap]);
    
    React.useEffect(() => {
        if(heatmap) {
            heatmap.setMap(layers.heatmap ? map : null);
        }
    }, [layers.heatmap, heatmap, map])
    
    return null;
}

const DirectionsRenderer = ({ request, onDirectionsChange }: { request: google.maps.DirectionsRequest | null; onDirectionsChange: MapViewProps['onDirectionsChange'] }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ 
            map, 
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 6
            }
        }));
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        if (!request) {
            directionsRenderer.setDirections(null);
            onDirectionsChange(null, null);
            return;
        }

        directionsService.route(request).then(response => {
            directionsRenderer.setDirections(response);
            const leg = response.routes[0]?.legs[0];
            if (leg && leg.distance && leg.duration && leg.steps) {
                const route: Route = {
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.map(step => ({
                        instructions: step.instructions.replace(/<[^>]*>/g, ""), // strip html tags
                        distance: step.distance!.text,
                        duration: step.duration!.text
                    })),
                    googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${(request.origin as google.maps.LatLng).lat()},${(request.origin as google.maps.LatLng).lng()}&destination=${(request.destination as google.maps.LatLng).lat()},${(request.destination as google.maps.LatLng).lng()}&travelmode=driving`
                };
                onDirectionsChange(response, route);
            }
        }).catch(e => {
            console.error("Directions request failed", e);
            directionsRenderer.setDirections(null);
            onDirectionsChange(null, null);
        });
    }, [directionsService, directionsRenderer, request, onDirectionsChange]);

    return null;
};


const MapEvents = ({ onMapInteraction }: Pick<MapViewProps, 'onMapInteraction'>) => {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;
    
    const onCameraChanged = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center && zoom) {
        onMapInteraction(center.toJSON(), zoom);
      }
    };
    
    const listeners = [
        map.addListener('zoom_changed', onCameraChanged),
        map.addListener('dragend', onCameraChanged),
    ];
    
    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [map, onMapInteraction]);

  return null;
}


const MapContent = ({ staff, incidents, cameras, layers, onIncidentClick, onCameraClick, onMapInteraction, directionsRequest, onDirectionsChange }: Omit<MapViewProps, 'center' | 'zoom'>) => {
  const map = useMap();

  if (!map) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading Map...</p>
      </div>
    );
  }

  return (
    <>
      {layers.staff && staff.map(s => <StaffMarker key={`staff-${s.id}`} staffMember={s} />)}
      {layers.incidents && incidents.map(i => <IncidentMarker key={`incident-${i.id}`} incident={i} onClick={onIncidentClick} />)}
      {layers.cameras && cameras.map(c => <CameraMarker key={`camera-${c.id}`} camera={c} onClick={onCameraClick} />)}
      <MapLayersComponent layers={layers} incidents={incidents} />
      <MapEvents onMapInteraction={onMapInteraction} />
      <DirectionsRenderer request={directionsRequest} onDirectionsChange={onDirectionsChange} />
    </>
  )
}


export default function MapView({ center, zoom, staff, incidents, cameras, layers, onIncidentClick, onCameraClick, onMapInteraction, directionsRequest, onDirectionsChange }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4 text-center">
        <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Google Maps API Key is Missing</AlertTitle>
            <AlertDescription>
                <p>To display the map, you need to add your Google Maps API key to the `.env` file:</p>
                <pre className="mt-2 bg-card p-2 rounded-md text-xs text-left">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
                </pre>
                 <p className="mt-2">If the error persists, ensure the API key is valid and has billing enabled in your Google Cloud Console.</p>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <APIProvider 
        apiKey={apiKey}
        onLoad={() => console.log('Maps API loaded.')}
        libraries={['visualization', 'routes']}
    >
      <div className="w-full h-full">
          <Map
            defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
            defaultZoom={12}
            center={center}
            zoom={zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'drishti_dark_map'}
            style={{width: '100%', height: '100%'}}
          >
              <MapContent
                staff={staff}
                incidents={incidents}
                cameras={cameras}
                layers={layers}
                onIncidentClick={onIncidentClick}
                onCameraClick={onCameraClick}
                onMapInteraction={onMapInteraction}
                directionsRequest={directionsRequest}
                onDirectionsChange={onDirectionsChange}
              />
          </Map>
      </div>
    </APIProvider>
  );
}
