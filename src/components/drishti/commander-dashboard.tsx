
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Alert, Staff, Incident, MapLayers, Location, Route, Camera } from '@/lib/types';
import Sidebar from '@/components/drishti/sidebar';
import MapView from '@/components/drishti/map-view';
import IncidentModal from '@/components/drishti/incident-modal';
import CameraView from '@/components/drishti/camera-view';
import LostAndFound from '@/components/drishti/lost-and-found';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import AiChatWidget from './ai-chat-widget';

const MOCK_CENTER: Location = { lat: 12.9716, lng: 77.5946 }; // Bengaluru

const generateRandomPoint = (center: Location, radius: number) => {
  const y0 = center.lat;
  const x0 = center.lng;
  const rd = radius / 111300; // about 111300 meters in one degree

  const u = Math.random();
  const v = Math.random();

  const w = rd * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return { lat: y + y0, lng: x + x0 };
};

const MOCK_ALERTS: Alert[] = [];

// Pre-defined valid road coordinates for the Commander
const COMMANDER_PATROL_ROUTE: Location[] = [
    { lat: 12.9740, lng: 77.5920 }, // Near Cubbon Park
    { lat: 12.9760, lng: 77.5960 }, // Near UB City
    { lat: 12.9720, lng: 77.5980 }, // Near Kanteerava Stadium
    { lat: 12.9700, lng: 77.5960 }, // South of UB City
    { lat: 12.9690, lng: 77.5920 }, // West of Cubbon Park
    { lat: 12.9716, lng: 77.5946 }, // return to center
];

const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Commander', role: 'Commander', location: COMMANDER_PATROL_ROUTE[0], avatar: `https://placehold.co/40x40.png`, status: 'Monitoring', route: null },
];

const MOCK_CAMERAS: Camera[] = [
    { id: 'cam-a', name: 'Camera A (Zone A)', location: { lat: 12.9685, lng: 77.5913 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+1' },
    { id: 'cam-b', name: 'Camera B (Zone B)', location: { lat: 12.9720, lng: 77.5980 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+2' },
    { id: 'cam-c', name: 'Camera C (Zone C)', location: { lat: 12.9760, lng: 77.5960 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+3' },
    { id: 'cam-d', name: 'Camera D (Zone D)', location: { lat: 12.9700, lng: 77.5960 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+4' },
];

const CAMERA_STORAGE_KEY = 'drishti-planning-camera-positions'; // Use planning positions

function Dashboard() {
  const [activeTab, setActiveTab] = useState('map');
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([...MOCK_ALERTS]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentRoute, setIncidentRoute] = useState<{
    directions: google.maps.DirectionsResult | null;
    routeInfo: Route | null;
  }>({ directions: null, routeInfo: null });
  
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    heatmap: true,
    staff: true,
    incidents: true,
    cameras: true,
    bottlenecks: true,
  });
  const [mapCenter, setMapCenter] = useState<Location>(MOCK_CENTER);
  const [mapZoom, setMapZoom] = useState(15);
  const { toast } = useToast();
  const [isCommanderAtJunctionA] = useState(false);

  useEffect(() => {
    // Load camera positions from localStorage (set by planning page)
    const savedCameras = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (savedCameras) {
      try {
        const parsedCameras = JSON.parse(savedCameras);
        // Basic validation
        if (Array.isArray(parsedCameras) && parsedCameras.every(c => c.id && c.location)) {
            setCameras(parsedCameras);
        } else {
            console.error("Invalid camera data in localStorage, using default.");
            setCameras(MOCK_CAMERAS);
        }
      } catch (error) {
        console.error("Failed to parse camera positions from localStorage", error);
        setCameras(MOCK_CAMERAS);
      }
    } else {
        // If no saved data, use mocks
        setCameras(MOCK_CAMERAS);
    }
  }, []);

  const handleAlertClick = useCallback((alert: Incident) => {
    setSelectedIncident(alert);
    setMapCenter(alert.location);
    setMapZoom(18);
    setActiveTab('map');
  }, []);


  const handleStaffClick = useCallback((staffMember: Staff) => {
    setMapCenter(staffMember.location);
    setMapZoom(18);
    setActiveTab('map');
  }, []);

  const handleToggleLayer = (layer: keyof MapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleMapInteraction = useCallback((center: Location, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  const handleDirectionsChange = useCallback((
    result: google.maps.DirectionsResult | null,
    route: Route | null
  ) => {
    setIncidentRoute({ directions: result, routeInfo: route });
  }, []);
  
  const handleCameraClick = useCallback((camera: Camera) => {
    setMapCenter(camera.location);
    setMapZoom(18);
    setActiveTab('cameras');
  }, []);

  const handleCameraMove = useCallback((cameraId: string, newLocation: Location) => {
    // In commander view, moving cameras is temporary for the session
    const updatedCameras = cameras.map(c => 
        c.id === cameraId ? { ...c, location: newLocation } : c
    );
    setCameras(updatedCameras);
    toast({
        title: "Camera Repositioned (Session)",
        description: `Camera ${cameraId} position updated for this session.`,
    })
  }, [cameras, toast]);


  const renderActiveView = () => {
    switch (activeTab) {
      case 'cameras':
        return <CameraView cameras={cameras} isCommanderAtJunctionA={isCommanderAtJunctionA} />;
      case 'lost-and-found':
        return <LostAndFound />;
      case 'map':
      default:
        return (
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            staff={staff}
            setStaff={setStaff}
            incidents={incidents}
            cameras={cameras}
            layers={mapLayers}
            patrolRoute={COMMANDER_PATROL_ROUTE}
            onIncidentClick={handleAlertClick}
            onCameraClick={handleCameraClick}
            onCameraMove={handleCameraMove}
            onMapInteraction={handleMapInteraction}
            incidentDirections={incidentRoute.directions}
            onIncidentDirectionsChange={handleDirectionsChange}
            isIncidentRouteActive={!!selectedIncident && selectedIncident.severity === 'High'}
          />
        );
    }
  };

  return (
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar
          alerts={alerts}
          staff={staff}
          onAlertClick={handleAlertClick}
          onStaffClick={handleStaffClick}
          mapLayers={mapLayers}
          onToggleLayer={handleToggleLayer}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <SidebarInset>
            {renderActiveView()}
             <AiChatWidget incidents={incidents} />
        </SidebarInset>
        <IncidentModal
          incident={selectedIncident}
          isOpen={!!selectedIncident}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedIncident(null);
              setIncidentRoute({ directions: null, routeInfo: null });
            }
          }}
          route={incidentRoute.routeInfo}
        />
      </div>
  );
}


export default function CommanderDashboard() {
  return (
    <SidebarProvider>
      <Dashboard />
    </SidebarProvider>
  )
}
