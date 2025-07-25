'use client';

import { useEffect, useRef } from 'react';
import type { Location, Staff, Incident, MapLayers } from '@/lib/types';
import { IncidentIcon } from '../icons/incident-icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { createRoot } from 'react-dom/client';

const mapStyles: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const severityColors = {
  High: '#ef4444',
  Medium: '#f97316',
  Low: '#3b82f6',
};

const SCRIPT_ID = 'googleMapsScript';
let isScriptLoaded = false;
let mapPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    if (mapPromise) {
        return mapPromise;
    }

    mapPromise = new Promise((resolve, reject) => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
            isScriptLoaded = true;
            resolve();
            return;
        }
        
        const existingScript = document.getElementById(SCRIPT_ID);
        if (existingScript) {
             // If script exists, it might be loading. We can't easily hook into its completion.
             // The best we can do is poll for the google object.
            const intervalId = setInterval(() => {
                if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
                    clearInterval(intervalId);
                    isScriptLoaded = true;
                    resolve();
                }
            }, 100);
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            isScriptLoaded = true;
            resolve();
        };
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
    
    return mapPromise;
};

interface MapViewProps {
  center: Location;
  zoom: number;
  staff: Staff[];
  incidents: Incident[];
  layers: MapLayers;
  onIncidentClick: (incident: Incident) => void;
}

export default function MapView({ center, zoom, staff, incidents, layers, onIncidentClick }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const polygonsRef = useRef<google.maps.Polygon[]>([]);
    
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error("Google Maps API key is missing.");
            return;
        }

        const initMap = () => {
             if (!mapRef.current || mapInstanceRef.current) return;

             const map = new google.maps.Map(mapRef.current, {
                center,
                zoom,
                styles: mapStyles,
                mapId: "drishti_dark_map",
                gestureHandling: 'greedy',
                disableDefaultUI: true,
            });
            mapInstanceRef.current = map;

            const heatmap = new google.maps.visualization.HeatmapLayer({
                map: map,
                radius: 40,
                opacity: 0.8,
            });
            heatmapRef.current = heatmap;
        }
        
        loadGoogleMapsScript(apiKey).then(initMap).catch(console.error);

    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (map) {
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [center, zoom]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const currentMarkers = markersRef.current;
        const newMarkers: { [key: string]: google.maps.Marker } = {};

        // Hide all current markers before deciding which ones to show
        Object.values(currentMarkers).forEach(marker => marker.setMap(null));

        // Update Staff Markers
        if(layers.staff) {
            staff.forEach(s => {
                const markerId = `staff-${s.id}`;
                if (currentMarkers[markerId]) {
                    currentMarkers[markerId].setPosition(s.location);
                    currentMarkers[markerId].setMap(map);
                    newMarkers[markerId] = currentMarkers[markerId];
                } else {
                    const container = document.createElement('div');
                    createRoot(container).render(
                        <Avatar className="border-2 border-blue-400">
                          <AvatarImage src={s.avatar} alt={s.name} data-ai-hint="person portrait"/>
                          <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    );
                    newMarkers[markerId] = new google.maps.Marker({
                        position: s.location,
                        map: map,
                        icon: {
                           url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(container.innerHTML)}`,
                           scaledSize: new google.maps.Size(40, 40)
                        }
                    });
                }
            });
        }
        
        // Update Incident Markers
        if (layers.incidents) {
            incidents.forEach(i => {
                const markerId = `incident-${i.id}`;
                if (currentMarkers[markerId]) {
                    currentMarkers[markerId].setPosition(i.location);
                    currentMarkers[markerId].setMap(map);
                    newMarkers[markerId] = currentMarkers[markerId];
                } else {
                    const container = document.createElement('div');
                    createRoot(container).render(
                         <div className="relative">
                            <IncidentIcon
                                type={i.type}
                                className="h-8 w-8 p-1.5 rounded-full bg-background border-2"
                                style={{ borderColor: severityColors[i.severity] }}
                                color={severityColors[i.severity]}
                            />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: severityColors[i.severity]}}></span>
                                <span className="relative inline-flex rounded-full h-3 w-3" style={{backgroundColor: severityColors[i.severity]}}></span>
                            </span>
                        </div>
                    );

                    const marker = new google.maps.Marker({
                        position: i.location,
                        map: map,
                        icon: {
                           url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(container.innerHTML)}`,
                           scaledSize: new google.maps.Size(40, 40),
                        }
                    });
                    marker.addListener('click', () => onIncidentClick(i));
                    newMarkers[markerId] = marker;
                }
            });
        }

        markersRef.current = newMarkers;

    }, [staff, incidents, layers.staff, layers.incidents, onIncidentClick]);
    
    useEffect(() => {
        const heatmap = heatmapRef.current;
        const map = mapInstanceRef.current;
        if (heatmap && map) {
            if (layers.heatmap) {
                const allPoints = [...staff.map(s => s.location), ...incidents.map(i => i.location)];
                if (allPoints.length > 0) {
                    const randomPoints = Array.from({ length: 100 }, () => {
                        const point = allPoints[Math.floor(Math.random() * allPoints.length)];
                        return new google.maps.LatLng(
                            point.lat + (Math.random() - 0.5) * 0.005,
                            point.lng + (Math.random() - 0.5) * 0.005,
                        );
                    });
                    heatmap.setData(randomPoints);
                } else {
                    heatmap.setData([]);
                }
                heatmap.setMap(map);
            } else {
                heatmap.setMap(null);
            }
        }
    }, [layers.heatmap, staff, incidents]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
         const bottleneckZones = [
            [
                { lat: 37.776, lng: -122.421 }, { lat: 37.777, lng: -122.419 },
                { lat: 37.775, lng: -122.418 }, { lat: 37.774, lng: -122.420 },
            ],
            [
                { lat: 37.773, lng: -122.425 }, { lat: 37.774, lng: -122.423 },
                { lat: 37.772, lng: -122.422 }, { lat: 37.771, lng: -122.424 },
            ]
        ];

        polygonsRef.current.forEach(p => p.setMap(null));
        polygonsRef.current = [];

        if (layers.bottlenecks) {
            bottleneckZones.forEach(zone => {
                const polygon = new google.maps.Polygon({
                    paths: zone,
                    fillColor: "#FF9800",
                    fillOpacity: 0.3,
                    strokeColor: "#FF9800",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    map: map
                });
                polygonsRef.current.push(polygon);
            });
        }
    }, [layers.bottlenecks]);

    return <div ref={mapRef} className="w-full h-full" />;
}
