
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Alert, Staff, Incident, MapLayers, Location, Route, Camera, HeatmapPoint } from '@/lib/types';
import Sidebar from '@/components/drishti/sidebar';
import MapView from '@/components/drishti/map-view';
import IncidentModal from '@/components/drishti/incident-modal';
import LostAndFound from '@/components/drishti/lost-and-found';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AiChatWidget from './ai-chat-widget';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import CameraGrid from './camera-grid'; // Changed from CameraView to CameraGrid

// --- MOCK DATA and CONSTANTS ---
const MOCK_CENTER: Location = { lat: 12.9716, lng: 77.5946 };
const COMMANDER_PATROL_ROUTE: Location[] = [
    { lat: 12.9740, lng: 77.5920 }, { lat: 12.9760, lng: 77.5960 }, { lat: 12.9720, lng: 77.5980 },
    { lat: 12.9700, lng: 77.5960 }, { lat: 12.9690, lng: 77.5920 }, { lat: 12.9716, lng: 77.5946 },
];
const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Commander', role: 'Commander', location: COMMANDER_PATROL_ROUTE[0], avatar: `https://placehold.co/40x40.png`, status: 'Monitoring', route: null },
  { id: 's2', name: 'Medic Team Alpha', role: 'Medical', location: { lat: 12.9765, lng: 77.5965 }, avatar: 'https://placehold.co/40x40.png', status: 'Patrolling', route: null },
  { id: 's3', name: 'Sec-1 (Main Stage)', role: 'Security', location: { lat: 12.9725, lng: 77.5985 }, avatar: 'https://placehold.co/40x40.png', status: 'Patrolling', route: null },
];

const MOCK_CAMERAS: Camera[] = [
    { id: 'cam1', name: 'Camera A (Zone A)', location: { lat: 12.9685, lng: 77.5913 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle1.mp4' },
    { id: 'cam2', name: 'Camera B (Zone B)', location: { lat: 12.9720, lng: 77.5980 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle2.mp4' },
    { id: 'cam3', name: 'Camera C (Zone C)', location: { lat: 12.9760, lng: 77.5960 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle3.mp4' },
    { id: 'cam4', name: 'Camera D (Zone D)', location: { lat: 12.9700, lng: 77.5960 }, streamUrl: 'https://storage.googleapis.com/event_safety/cam_angle4.mp4' },
];
const CAMERA_STORAGE_KEY = 'drishti-planning-camera-positions';

// --- Helper Functions ---
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
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentRoute, setIncidentRoute] = useState<{ directions: google.maps.DirectionsResult | null; routeInfo: Route | null; }>({ directions: null, routeInfo: null });
  const [mapLayers, setMapLayers] = useState<MapLayers>({ heatmap: true, staff: true, incidents: true, cameras: true, bottlenecks: true });
  const [mapCenter, setMapCenter] = useState<Location>(MOCK_CENTER);
  const [mapZoom, setMapZoom] = useState(15);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]); // Added heatmapPoints state
  const { toast } = useToast();
  const routesLibrary = useMapsLibrary('routes');
  const directionsServiceRef = useRef<google.maps.DirectionsService>();

  useEffect(() => { if (routesLibrary) { directionsServiceRef.current = new routesLibrary.DirectionsService(); } }, [routesLibrary]);

  useEffect(() => {
    const savedCameras = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (savedCameras) {
      try {
        const parsedCameras = JSON.parse(savedCameras);
        const cameraData = MOCK_CAMERAS.map(mc => {
            const saved = parsedCameras.find((pc: any) => pc.id === mc.id);
            return saved ? { ...mc, location: saved.location } : mc;
        });
        setCameras(cameraData);
      } catch { setCameras(MOCK_CAMERAS); }
    } else { setCameras(MOCK_CAMERAS); }
  }, []);

  useEffect(() => {
    if (cameras.length === 0) return;
    const interval = setInterval(() => {
        const newIncident = generateRandomIncident(cameras);
        setIncidents(prev => [newIncident, ...prev]);
        setAlerts(prev => [newIncident, ...prev].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
        toast({ title: `New ${newIncident.severity} Severity Alert`, description: newIncident.description });
    }, 15000);
    return () => clearInterval(interval);
  }, [cameras, toast]);
  
  const handleTabSelect = (tab: string) => { // Widened type to string
      setActiveTab(tab);
  };

  const handleAlertClick = useCallback((alert: Incident) => {
    setSelectedIncident(alert); setMapCenter(alert.location); setMapZoom(18); setActiveTab('alerts');
  }, []);
  const handleStaffClick = useCallback((staffMember: Staff) => {
    setMapCenter(staffMember.location); setMapZoom(18); setActiveTab('staff');
  }, []);
  const handleToggleLayer = useCallback((layer: keyof MapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);
  const handleMapInteraction = useCallback((center: Location, zoom: number) => {
    setMapCenter(center); setMapZoom(zoom);
  }, []);
  const handleDirectionsChange = useCallback((result: google.maps.DirectionsResult | null, route: Route | null) => {
    setIncidentRoute({ directions: result, routeInfo: route });
  }, []);
  const handleCameraClickOnMap = useCallback((camera: Camera) => {
    setMapCenter(camera.location); setMapZoom(18); setActiveTab('cameras');
  }, []);
  const handleCameraMove = useCallback((cameraId: string, newLocation: Location) => {
    const updatedCameras = cameras.map(c => c.id === cameraId ? { ...c, location: newLocation } : c);
    setCameras(updatedCameras);
    toast({ title: "Camera Repositioned (Session)", description: `Camera ${cameras.find(c=>c.id === cameraId)?.name} position updated.` });
  }, [cameras, toast]);

  const handleHeatmapUpdate = useCallback((points: HeatmapPoint[]) => { // Added handleHeatmapUpdate
    setHeatmapPoints(points);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
        case 'lost-and-found':
            return <LostAndFound />;
        case 'cameras':
            return <CameraGrid cameras={cameras} onHeatmapUpdate={handleHeatmapUpdate} />; // Changed from CameraView to CameraGrid
        case 'alerts':
        case 'staff':
        default:
            return (
                <MapView
                    center={mapCenter} zoom={mapZoom} staff={staff} setStaff={setStaff} incidents={incidents}
                    cameras={cameras} layers={mapLayers} patrolRoute={COMMANDER_PATROL_ROUTE}
                    onIncidentClick={handleAlertClick} onCameraClick={handleCameraClickOnMap}
                    onCameraMove={handleCameraMove} onMapInteraction={handleMapInteraction}
                    incidentDirections={incidentRoute.directions} onIncidentDirectionsChange={handleDirectionsChange}
                    isIncidentRouteActive={!!selectedIncident && selectedIncident.severity === 'High'}
                    heatmapData={heatmapPoints} // Pass heatmapPoints to MapView
                />
            );
    }
  };

  return (
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar
          alerts={alerts} staff={staff} onAlertClick={handleAlertClick} onStaffClick={handleStaffClick}
          mapLayers={mapLayers} onToggleLayer={handleToggleLayer} onTabSelect={handleTabSelect}
          activeTab={activeTab}
        />
        <SidebarInset>
            {renderActiveView()}
             <AiChatWidget incidents={incidents} />
        </SidebarInset>
        <IncidentModal
          incident={selectedIncident} isOpen={!!selectedIncident}
          onOpenChange={(isOpen) => { if (!isOpen) { setSelectedIncident(null); setIncidentRoute({ directions: null, routeInfo: null }); } }}
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
