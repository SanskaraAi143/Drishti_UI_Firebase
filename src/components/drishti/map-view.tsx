'use client';

import { useEffect, useState, memo } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Location, Staff, Incident, MapLayers } from '@/lib/types';
import { IncidentIcon } from '../icons/incident-icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Polygon } from '../ui/polygon';

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const severityColors = {
  High: '#ef4444', // red-500
  Medium: '#f97316', // orange-500
  Low: '#3b82f6', // blue-500
};


const HeatmapLayer = ({ locations }: { locations: Location[] }) => {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !visualization) return;

    const heatmapData = locations.map(loc => new google.maps.LatLng(loc.lat, loc.lng));
    
    if (!heatmap) {
      const newHeatmap = new visualization.HeatmapLayer({
        map,
        data: heatmapData,
      });
      newHeatmap.set('radius', 40);
      newHeatmap.set('opacity', 0.8);
      setHeatmap(newHeatmap);
    } else {
      heatmap.setData(heatmapData);
    }
  }, [map, visualization, locations, heatmap]);
  
  return null;
}

const MemoizedStaffMarker = memo(({ staff, onIncidentClick }: { staff: Staff; onIncidentClick: (incident: Incident) => void }) => (
  <AdvancedMarker position={staff.location}>
    <Avatar className="border-2 border-blue-400">
      <AvatarImage src={staff.avatar} alt={staff.name} data-ai-hint="person portrait"/>
      <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
    </Avatar>
  </AdvancedMarker>
));
MemoizedStaffMarker.displayName = 'MemoizedStaffMarker';


const MemoizedIncidentMarker = memo(({ incident, onIncidentClick }: { incident: Incident; onIncidentClick: (incident: Incident) => void }) => (
  <AdvancedMarker position={incident.location} onClick={() => onIncidentClick(incident)}>
    <div className="relative">
      <IncidentIcon
        type={incident.type}
        className="h-8 w-8 p-1.5 rounded-full bg-background border-2"
        style={{ borderColor: severityColors[incident.severity] }}
        color={severityColors[incident.severity]}
      />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: severityColors[incident.severity]}}></span>
        <span className="relative inline-flex rounded-full h-3 w-3" style={{backgroundColor: severityColors[incident.severity]}}></span>
      </span>
    </div>
  </AdvancedMarker>
));
MemoizedIncidentMarker.displayName = 'MemoizedIncidentMarker';


const BottlenecksLayer = () => {
  const bottleneckZones = [
      [
        { lat: 37.776, lng: -122.421 },
        { lat: 37.777, lng: -122.419 },
        { lat: 37.775, lng: -122.418 },
        { lat: 37.774, lng: -122.420 },
      ],
      [
        { lat: 37.773, lng: -122.425 },
        { lat: 37.774, lng: -122.423 },
        { lat: 37.772, lng: -122.422 },
        { lat: 37.771, lng: -122.424 },
      ]
  ];

  return <>
      {bottleneckZones.map((zone, index) => (
          <Polygon key={index} paths={zone} options={{
              fillColor: "#FF9800",
              fillOpacity: 0.3,
              strokeColor: "#FF9800",
              strokeOpacity: 0.8,
              strokeWeight: 2,
          }}/>
      ))}
  </>
}

interface MapViewProps {
  center: Location;
  zoom: number;
  staff: Staff[];
  incidents: Incident[];
  layers: MapLayers;
  onIncidentClick: (incident: Incident) => void;
}

export default function MapView({ center, zoom, staff, incidents, layers, onIncidentClick }: MapViewProps) {
  const [heatmapLocations, setHeatmapLocations] = useState<Location[]>([]);

  useEffect(() => {
    const allPoints = [...staff.map(s => s.location), ...incidents.map(i => i.location)];
    const randomPoints = Array.from({ length: 100 }, () => {
      const point = allPoints[Math.floor(Math.random() * allPoints.length)];
      if (!point) return {lat: 0, lng: 0};
      return {
        lat: point.lat + (Math.random() - 0.5) * 0.005,
        lng: point.lng + (Math.random() - 0.5) * 0.005,
      };
    }).filter(p => p.lat !== 0);
    setHeatmapLocations(randomPoints);
  }, [staff, incidents]);


  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['visualization']}>
      <Map
        center={center}
        zoom={zoom}
        mapId="drishti_dark_map"
        styles={mapStyles}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="w-full h-full"
      >
        {layers.staff && staff.map(s => <MemoizedStaffMarker key={s.id} staff={s} onIncidentClick={onIncidentClick} />)}
        {layers.incidents && incidents.map(i => <MemoizedIncidentMarker key={i.id} incident={i} onIncidentClick={onIncidentClick} />)}
        {layers.heatmap && <HeatmapLayer locations={heatmapLocations} />}
        {layers.bottlenecks && <BottlenecksLayer />}
      </Map>
    </APIProvider>
  );
}
