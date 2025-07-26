
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Alert, Staff, Incident, MapLayers, Location, Camera } from '@/lib/types';
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

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'Altercation', description: 'Fight reported near main stage.', timestamp: new Date(), location: generateRandomPoint(MOCK_CENTER, 500), severity: 'High', source: 'Crowd Report' },
  { id: 'a2', type: 'Medical', description: 'Person fainted at entrance A.', timestamp: new Date(Date.now() - 2 * 60000), location: generateRandomPoint(MOCK_CENTER, 500), severity: 'Medium', source: 'AI Anomaly Detection' },
  { id: 'a3', type: 'UnattendedObject', description: 'Suspicious bag found near food court.', timestamp: new Date(Date.now() - 5 * 60000), location: generateRandomPoint(MOCK_CENTER, 500), severity: 'Medium', source: 'Staff Report' },
  { id: 'a4', type: 'CrowdSurge', description: 'Crowd density increasing rapidly at west gate.', timestamp: new Date(Date.now() - 10 * 60000), location: generateRandomPoint(MOCK_CENTER, 500), severity: 'Low', source: 'AI Anomaly Detection' },
];

const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Commander', role: 'Commander', location: generateRandomPoint(MOCK_CENTER, 500), avatar: `https://placehold.co/40x40.png`, status: 'Monitoring' },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState('map');
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [incidents, setIncidents] = useState<Incident[]>([...MOCK_ALERTS]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    heatmap: true,
    staff: true,
    incidents: true,
    bottlenecks: true,
  });
  const [mapCenter, setMapCenter] = useState<Location>(MOCK_CENTER);
  const [mapZoom, setMapZoom] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    const alertInterval = setInterval(() => {
      const newAlert: Alert = {
        id: `a${Date.now()}`,
        type: (['Altercation', 'Medical', 'CrowdSurge', 'UnattendedObject'] as const)[Math.floor(Math.random() * 4)],
        description: 'New automated alert generated.',
        timestamp: new Date(),
        location: generateRandomPoint(MOCK_CENTER, 500),
        severity: 'High',
        source: 'AI Anomaly Detection'
      };
      setAlerts(prev => [newAlert, ...prev]);
      setIncidents(prev => [newAlert, ...prev]);
      toast({
        title: `🚨 New ${newAlert.severity} Severity Alert`,
        description: newAlert.description,
        variant: 'destructive',
      });
    }, 30000); // New alert every 30 seconds

    const staffInterval = setInterval(() => {
        setStaff(prevStaff => prevStaff.map(s => ({
            ...s,
            location: generateRandomPoint(s.location, 50)
        })));
    }, 5000); // Update staff location every 5 seconds

    return () => {
      clearInterval(alertInterval);
      clearInterval(staffInterval);
    };
  }, [toast]);

  const handleAlertClick = useCallback((alert: Alert) => {
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


  const renderActiveView = () => {
    switch (activeTab) {
      case 'cameras':
        return <CameraView />;
      case 'lost-and-found':
        return <LostAndFound />;
      case 'map':
      default:
        return (
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            staff={staff}
            incidents={incidents}
            layers={mapLayers}
            onIncidentClick={handleAlertClick}
            onMapInteraction={handleMapInteraction}
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
          onOpenChange={(isOpen) => !isOpen && setSelectedIncident(null)}
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
