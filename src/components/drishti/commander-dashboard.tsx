
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Alert, Staff, Incident, MapLayers, Location, Route, Camera } from '@/lib/types';
import Sidebar from '@/components/drishti/sidebar';
import ClientOnlyMap from '@/components/drishti/client-only-map';
import IncidentModal from '@/components/drishti/incident-modal';
import CameraView from '@/components/drishti/camera-view';
import LostAndFound from '@/components/drishti/lost-and-found';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import AiChatWidget from './ai-chat-widget';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

const MOCK_CENTER: Location = { lat: 12.9716, lng: 77.5946 }; // Bengaluru

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
  { id: 's2', name: 'Medic Team Alpha', role: 'Medical', location: { lat: 12.9765, lng: 77.5965 }, avatar: 'https://placehold.co/40x40.png', status: 'Patrolling', route: null },
  { id: 's3', name: 'Sec-1 (Main Stage)', role: 'Security', location: { lat: 12.9725, lng: 77.5985 }, avatar: 'https://placehold.co/40x40.png', status: 'Patrolling', route: null },
  { id: 's4', name: 'Ops Manager', role: 'Operations', location: { lat: 12.9695, lng: 77.5925 }, avatar: 'https://placehold.co/40x40.png', status: 'On-Break', route: null },
];

const MOCK_CAMERAS: Camera[] = [
    { id: 'cam-a', name: 'Camera A (Zone A)', location: { lat: 12.9685, lng: 77.5913 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle1.mp4' },
    { id: 'cam-b', name: 'Camera B (Zone B)', location: { lat: 12.9720, lng: 77.5980 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle2.mp4' },
    { id: 'cam-c', name: 'Camera C (Zone C)', location: { lat: 12.9760, lng: 77.5960 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle3.mp4' },
    { id: 'cam-d', name: 'Camera D (Zone D)', location: { lat: 12.9700, lng: 77.5960 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle4.mp4' },
];

const CAMERA_STORAGE_KEY = 'drishti-planning-camera-positions'; // Use planning positions

// Helper function to generate random incidents
const generateRandomIncident = (cameras: Camera[]): Incident => {
    const types: Incident['type'][] = ['CrowdSurge', 'Altercation', 'Medical', 'UnattendedObject'];
    const severities: Incident['severity'][] = ['Low', 'Medium', 'High'];
    const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];

    return {
        id: `inc-${Date.now()}-${Math.random()}`,
        type: types[Math.floor(Math.random() * types.length)],
        description: `A new ${types[Math.floor(Math.random() * 4)]} event has been detected near ${randomCamera.name}.`,
        timestamp: new Date(),
        location: {
            lat: randomCamera.location.lat + (Math.random() - 0.5) * 0.001,
            lng: randomCamera.location.lng + (Math.random() - 0.5) * 0.001,
        },
        severity: severities[Math.floor(Math.random() * severities.length)],
        source: randomCamera.id,
    };
};

function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidentRoute, setIncidentRoute] = useState<{ directions: google.maps.DirectionsResult | null; routeInfo: Route | null }>({ directions: null, routeInfo: null });
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [cameras, setCameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    heatmap: true,
    staff: true,
    incidents: true,
    cameras: true,
    bottlenecks: true,
  });
  const [mapCenter, setMapCenter] = useState<Location>(MOCK_CENTER);
  const [mapZoom, setMapZoom] = useState(15);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [isCommanderAtJunctionA, setIsCommanderAtJunctionA] = useState(false);
  const routesLibrary = useMapsLibrary('routes');
  const directionsServiceRef = useRef<google.maps.DirectionsService>();

  // Define callback functions first, before useEffect hooks
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

  const handleToggleLayer = useCallback((layer: keyof MapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

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
        description: `Camera ${cameras.find(c=>c.id === cameraId)?.name} position updated for this session only.`,
    })
  }, [cameras, toast]);

  useEffect(() => {
    if (routesLibrary) {
        directionsServiceRef.current = new routesLibrary.DirectionsService();
    }
  }, [routesLibrary]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Load camera positions from localStorage (set by planning page)
    const savedCameras = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (savedCameras) {
      try {
        const parsedCameras = JSON.parse(savedCameras);
        if (Array.isArray(parsedCameras) && parsedCameras.every(c => c.id && c.location)) {
            // Merge saved locations with mock stream URLs
            const cameraData = MOCK_CAMERAS.map(mc => {
                const saved = parsedCameras.find(pc => pc.id === mc.id);
                return saved ? { ...mc, location: saved.location } : mc;
            });
            setCameras(cameraData);
        } else {
            console.warn('Invalid camera data structure, using fallback');
            setCameras(MOCK_CAMERAS);
        }
      } catch (error) {
        console.error('Failed to parse saved cameras:', error);
        setCameras(MOCK_CAMERAS);
      }
    } else {
        setCameras(MOCK_CAMERAS);
    }
  }, [isMounted]);

  // Simulate real-time alerts
  useEffect(() => {
      if (cameras.length === 0) return;

      const interval = setInterval(() => {
          const newIncident = generateRandomIncident(cameras);
          setIncidents(prev => [newIncident, ...prev]);
          setAlerts(prev => [newIncident, ...prev].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
          
          toast({
            title: `New ${newIncident.severity} Severity Alert`,
            description: newIncident.description,
          });

          // If high severity, calculate route for commander
          if (newIncident.severity === 'High' && directionsServiceRef.current) {
            const commander = staff.find(s => s.role === 'Commander');
            if (commander) {
                const request: google.maps.DirectionsRequest = {
                    origin: commander.location,
                    destination: newIncident.location,
                    travelMode: google.maps.TravelMode.DRIVING,
                };
                directionsServiceRef.current.route(request, (result, status) => {
                    if (status === 'OK' && result) {
                        handleDirectionsChange(result, null);
                        setSelectedIncident(newIncident);
                    } else {
                        console.error('Failed to calculate route:', status);
                    }
                });
            }
          }

      }, 15000); // New alert every 15 seconds

      return () => clearInterval(interval);
  }, [cameras, toast, staff, handleDirectionsChange]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'cameras':
        return <CameraView cameras={cameras} isCommanderAtJunctionA={isCommanderAtJunctionA} />;
      case 'lost-and-found':
        return <LostAndFound />;
      case 'map':
      default:
        return (
          <ClientOnlyMap
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
