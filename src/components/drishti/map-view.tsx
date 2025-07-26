
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

const CameraMarker = ({ camera, onClick, onDragEnd }: { camera: Camera, onClick: (camera: Camera) => void, onDragEnd: (e: google.maps.MapMouseEvent) => void }) => {
    return (
      <AdvancedMarker
        position={camera.location}
        title={camera.name}
        onClick={() => onClick(camera)}
        draggable={true}
        onDragEnd={onDragEnd}
      >
        <div className="p-1.5 rounded-full bg-background border-2 border-gray-500 cursor-grab active:cursor-grabbing">
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

const DirectionsRenderer = ({ 
    directions,
    onDirectionsChange,
    routeId,
    color,
    render,
}: { 
    directions: google.maps.DirectionsResult | null; 
    onDirectionsChange?: (result: google.maps.DirectionsResult | null, route: Route | null) => void;
    routeId: string;
    color: string;
    render?: boolean;
}) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!routesLibrary || !map) return;
        if (!directionsRenderer) {
            const renderer = new routesLibrary.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: color,
                    strokeOpacity: 0.8,
                    strokeWeight: 6
                },
            });
            setDirectionsRenderer(renderer);
        }

        return () => {
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
            }
        };
    }, [routesLibrary, map, color]);

    useEffect(() => {
        if (!directionsRenderer) return;
        if (directions && render) {
            directionsRenderer.setDirections(directions);
        } else {
            directionsRenderer.setDirections(null);
        }
    }, [directionsRenderer, directions, render]);

    useEffect(() => {
        if (directions && onDirectionsChange) {
            const leg = directions.routes[0]?.legs[0];
            if (leg && leg.distance && leg.duration && leg.steps) {
                const route: Route = {
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.map(step => ({
                        instructions: step.instructions.replace(/<[^>]*>/g, ""),
                        distance: step.distance!.text,
                        duration: step.duration!.text
                    })),
                    googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${leg.start_location.lat()},${leg.start_location.lng()}&destination=${leg.end_location.lat()},${leg.end_location.lng()}&travelmode=driving`
                };
                onDirectionsChange(directions, route);
            }
        } else if (onDirectionsChange) {
            onDirectionsChange(null, null);
        }
    }, [directions, onDirectionsChange]);

    return null;
};

function usePatrol(
    isPatrolActive: boolean,
    patrolRoute: Location[],
    onNewPatrolLeg: (directions: google.maps.DirectionsResult | null) => void
) {
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const patrolIndexRef = useRef(0);

    useEffect(() => {
        if (!routesLibrary) return;
        setDirectionsService(new routesLibrary.DirectionsService());
    }, [routesLibrary]);

    useEffect(() => {
        let patrolTimeout: NodeJS.Timeout;

        const startPatrol = () => {
            if (!directionsService || !isPatrolActive) return;
            
            const currentIndex = patrolIndexRef.current;
            const nextIndex = (currentIndex + 1) % patrolRoute.length;
            const origin = patrolRoute[currentIndex];
            const destination = patrolRoute[nextIndex];

            const request = {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request).then(response => {
                onNewPatrolLeg(response);
                patrolIndexRef.current = nextIndex;

                const durationInSeconds = response.routes[0].legs[0].duration?.value || 30;
                patrolTimeout = setTimeout(startPatrol, (durationInSeconds + 5) * 1000); // Wait for route duration + 5s buffer
            }).catch(e => {
                console.error("Patrol route request failed", e);
                onNewPatrolLeg(null);
                 patrolTimeout = setTimeout(startPatrol, 10000); // Retry after 10s
            });
        };

        if (isPatrolActive) {
            startPatrol();
        }

        return () => {
            clearTimeout(patrolTimeout);
        };
    }, [directionsService, isPatrolActive, patrolRoute, onNewPatrolLeg]);
}

function useMarkerAnimation(
    route: google.maps.DirectionsResult | null,
    onLocationUpdate: (location: Location) => void,
    onAnimationComplete: () => void
) {
    const animationFrameRef = useRef<number>();
    const routePathRef = useRef<Location[]>([]);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (route) {
            const path = route.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
            routePathRef.current = path;
            startTimeRef.current = null; // Reset start time for new route

            const animate = (timestamp: number) => {
                if (!startTimeRef.current) {
                    startTimeRef.current = timestamp;
                }

                const progress = timestamp - startTimeRef.current;
                const duration = (route.routes[0].legs[0].duration?.value || 30) * 1000;
                const progressRatio = Math.min(progress / duration, 1);

                const path = routePathRef.current;
                const pathIndex = Math.floor(progressRatio * (path.length - 1));
                const nextPointIndex = Math.min(pathIndex + 1, path.length - 1);
                
                const segmentProgress = (progressRatio * (path.length - 1)) - pathIndex;

                const lat = path[pathIndex].lat + (path[nextPointIndex].lat - path[pathIndex].lat) * segmentProgress;
                const lng = path[pathIndex].lng + (path[nextPointIndex].lng - path[pathIndex].lng) * segmentProgress;
                
                onLocationUpdate({ lat, lng });

                if (progressRatio < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    onAnimationComplete();
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [route, onLocationUpdate, onAnimationComplete]);
}

const CommanderPatrol = ({ staff, setStaff, patrolRoute, isIncidentRouteActive }: Pick<MapViewProps, 'staff' | 'setStaff' | 'patrolRoute' | 'isIncidentRouteActive'>) => {
    const [patrolDirections, setPatrolDirections] = useState<google.maps.DirectionsResult | null>(null);
    const commander = staff.find(s => s.role === 'Commander');

    const handleNewPatrolLeg = useCallback((directions: google.maps.DirectionsResult | null) => {
        setPatrolDirections(directions);
    }, []);
    
    usePatrol(!isIncidentRouteActive, patrolRoute, handleNewPatrolLeg);

    const handleLocationUpdate = useCallback((location: Location) => {
        setStaff(prevStaff => prevStaff.map(s => 
            s.role === 'Commander' ? { ...s, location } : s
        ));
    }, [setStaff]);

    const handleAnimationComplete = useCallback(() => {
       // The usePatrol hook will automatically start the next leg.
    }, []);

    useMarkerAnimation(
        !isIncidentRouteActive ? patrolDirections : null,
        handleLocationUpdate,
        handleAnimationComplete
    );

    if (!commander) return null;
    
    return <DirectionsRenderer directions={patrolDirections} routeId="patrol" color="#3b82f6" render={false} />;
}


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


const MapContent = ({ staff, setStaff, incidents, cameras, layers, onIncidentClick, onCameraClick, onCameraMove, onMapInteraction, patrolRoute, incidentDirections, onIncidentDirectionsChange, isIncidentRouteActive }: Omit<MapViewProps, 'center' | 'zoom'>) => {
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
      {layers.cameras && cameras.map(c => 
        <CameraMarker 
            key={`camera-${c.id}`} 
            camera={c} 
            onClick={onCameraClick}
            onDragEnd={(e) => {
                if(e.latLng) {
                    onCameraMove(c.id, e.latLng.toJSON())
                }
            }}
        />
      )}
      <MapLayersComponent layers={layers} incidents={incidents} />
      <MapEvents onMapInteraction={onMapInteraction} />
      <DirectionsRenderer 
          directions={incidentDirections} 
          onDirectionsChange={onIncidentDirectionsChange}
          routeId="incident"
          color="#D32F2F"
          render={isIncidentRouteActive}
      />
      <CommanderPatrol 
        staff={staff}
        setStaff={setStaff}
        patrolRoute={patrolRoute}
        isIncidentRouteActive={isIncidentRouteActive}
      />
    </>
  )
}


export default function MapView({ center, zoom, staff, setStaff, incidents, cameras, layers, onIncidentClick, onCameraClick, onCameraMove, onMapInteraction, patrolRoute, incidentDirections, onIncidentDirectionsChange, isIncidentRouteActive }: MapViewProps) {
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
                setStaff={setStaff}
                incidents={incidents}
                cameras={cameras}
                layers={layers}
                patrolRoute={patrolRoute}
                onIncidentClick={onIncidentClick}
                onCameraClick={onCameraClick}
                onCameraMove={onCameraMove}
                onMapInteraction={onMapInteraction}
                incidentDirections={incidentDirections}
                onIncidentDirectionsChange={onIncidentDirectionsChange}
                isIncidentRouteActive={isIncidentRouteActive}
              />
          </Map>
      </div>
    </APIProvider>
  );
}
