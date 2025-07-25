'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { Location, Staff, Incident, MapLayers } from '@/lib/types';
import { IncidentIcon } from '../icons/incident-icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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

declare global {
    interface Window {
        initMap?: () => void;
    }
}

let mapLoadPromise: Promise<void> | null = null;
const SCRIPT_ID = 'googleMapsScript';

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    if (mapLoadPromise) {
        return mapLoadPromise;
    }

    mapLoadPromise = new Promise((resolve, reject) => {
        if (document.getElementById(SCRIPT_ID)) {
            if (window.google?.maps) {
                resolve();
                return;
            }
             window.initMap = () => {
                resolve();
             };

        } else {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,marker&callback=initMap`;
            script.async = true;
            script.defer = true;
            
            window.initMap = () => {
                resolve();
            };

            script.onerror = (error) => {
                console.error("Failed to load Google Maps script:", error);
                reject(error);
                mapLoadPromise = null; // Reset promise on error
            };

            document.head.appendChild(script);
        }
    });
    return mapLoadPromise;
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
    const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement | google.maps.Marker }>({});
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const polygonsRef = useRef<google.maps.Polygon[]>([]);
    
    const [isMapInitialized, setIsMapInitialized] = useState(false);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.");
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => {
                if (!mapRef.current || mapInstanceRef.current) return;

                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: 12.9716, lng: 77.5946 }, // Use Bengaluru as initial center
                    zoom: 12, // Use initial zoom from reference
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

                const bengaluruMarker = new google.maps.Marker({
                    position: { lat: 12.9716, lng: 77.5946 },
                    map: map,
                    title: 'Bengaluru, India'
                });
                
                const infoWindow = new google.maps.InfoWindow({
                    content: '<h2>Welcome to Bengaluru!</h2><p>The Garden City of India.</p>'
                });
                
                bengaluruMarker.addListener('click', () => {
                    infoWindow.open(map, bengaluruMarker);
                });
                markersRef.current['bengaluru-marker'] = bengaluruMarker;

                setIsMapInitialized(true);
            })
            .catch(error => {
                console.error("Error loading Google Maps or initializing map:", error);
            });

    }, []); 

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (map && isMapInitialized) {
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [center, zoom, isMapInitialized]);

    const createStaffMarkerElement = useCallback((s: Staff): HTMLElement => {
        const container = document.createElement('div');
        container.className = "flex items-center justify-center";
        createRoot(container).render(
            <Avatar className="border-2 border-blue-400">
                <AvatarImage src={s.avatar} alt={s.name} data-ai-hint="person portrait" />
                <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
            </Avatar>
        );
        return container;
    }, []);

    const createIncidentMarkerElement = useCallback((i: Incident): HTMLElement => {
        const container = document.createElement('div');
        container.className = "relative";
        createRoot(container).render(
            <>
                <IncidentIcon
                    type={i.type}
                    className="h-8 w-8 p-1.5 rounded-full bg-background border-2"
                    style={{ borderColor: severityColors[i.severity] }}
                    color={severityColors[i.severity]}
                />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: severityColors[i.severity] }}></span>
                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: severityColors[i.severity] }}></span>
                </span>
            </>
        );
        return container;
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapInitialized) return;

        const currentMarkers = markersRef.current;
        const newMarkers: { [key: string]: google.maps.marker.AdvancedMarkerElement | google.maps.Marker } = {
             'bengaluru-marker': currentMarkers['bengaluru-marker']
        };

        const activeMarkerIds = new Set<string>(['bengaluru-marker']);

        if (layers.staff) {
            staff.forEach(s => {
                const markerId = `staff-${s.id}`;
                activeMarkerIds.add(markerId);
                let marker = currentMarkers[markerId] as google.maps.marker.AdvancedMarkerElement;

                if (marker) {
                    marker.position = s.location;
                } else {
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: s.location,
                        map: map,
                        content: createStaffMarkerElement(s),
                        title: s.name,
                    });
                }
                newMarkers[markerId] = marker;
            });
        }

        if (layers.incidents) {
            incidents.forEach(i => {
                const markerId = `incident-${i.id}`;
                activeMarkerIds.add(markerId);
                let marker = currentMarkers[markerId] as google.maps.marker.AdvancedMarkerElement;

                if (marker) {
                    marker.position = i.location;
                } else {
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: i.location,
                        map: map,
                        content: createIncidentMarkerElement(i),
                        title: `${i.type} Incident (${i.severity})`,
                    });
                    marker.addListener('click', () => onIncidentClick(i));
                }
                newMarkers[markerId] = marker;
            });
        }
        
        // Remove old markers
        Object.keys(currentMarkers).forEach(markerId => {
            if (!activeMarkerIds.has(markerId)) {
                (currentMarkers[markerId] as any).map = null;
                delete newMarkers[markerId];
            }
        });

        // Set markers to map
        Object.values(newMarkers).forEach(marker => {
             (marker as any).map = map;
        });
        
        markersRef.current = newMarkers;

    }, [staff, incidents, layers.staff, layers.incidents, onIncidentClick, isMapInitialized, createStaffMarkerElement, createIncidentMarkerElement]);

    useEffect(() => {
        const heatmap = heatmapRef.current;
        if (heatmap && isMapInitialized) {
            if (layers.heatmap) {
                const allPoints = [...staff.map(s => new google.maps.LatLng(s.location.lat, s.location.lng)),
                                   ...incidents.map(i => new google.maps.LatLng(i.location.lat, i.location.lng))];
                
                heatmap.setData(allPoints.length > 0 ? allPoints : []);
                heatmap.setMap(mapInstanceRef.current);
            } else {
                heatmap.setMap(null);
            }
        }
    }, [layers.heatmap, staff, incidents, isMapInitialized]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapInitialized) return;

        polygonsRef.current.forEach(p => p.setMap(null));
        polygonsRef.current = [];

        if (layers.bottlenecks) {
            const bottleneckZones = [
                [
                    { lat: 12.9760, lng: 77.5930 },
                    { lat: 12.9780, lng: 77.6000 },
                    { lat: 12.9730, lng: 77.6020 },
                    { lat: 12.9710, lng: 77.5950 },
                ],
                [
                    { lat: 12.9350, lng: 77.6100 },
                    { lat: 12.9380, lng: 77.6150 },
                    { lat: 12.9330, lng: 77.6180 },
                    { lat: 12.9300, lng: 77.6130 },
                ]
            ];

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
    }, [layers.bottlenecks, isMapInitialized]);

    return (
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '300px' }} />
    );
}