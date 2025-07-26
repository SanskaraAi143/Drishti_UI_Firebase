
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Camera, Location } from '@/lib/types';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Video, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const MOCK_CENTER: Location = { lat: 12.9716, lng: 77.5946 }; // Bengaluru

const MOCK_CAMERAS: Camera[] = [
    { id: 'cam-a', name: 'Camera A (Zone A)', location: { lat: 12.9685, lng: 77.5913 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+1' },
    { id: 'cam-b', name: 'Camera B (Zone B)', location: { lat: 12.9720, lng: 77.5980 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+2' },
    { id: 'cam-c', name: 'Camera C (Zone C)', location: { lat: 12.9760, lng: 77.5960 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+3' },
    { id: 'cam-d', name: 'Camera D (Zone D)', location: { lat: 12.9700, lng: 77.5960 }, streamUrl: 'https://placehold.co/640x480.png?text=Live+Feed+4' },
];

const CAMERA_STORAGE_KEY = 'drishti-planning-camera-positions';


const CameraMarker = ({ camera, onDragEnd }: { camera: Camera, onDragEnd: (e: google.maps.MapMouseEvent) => void }) => {
    return (
      <AdvancedMarker
        position={camera.location}
        title={camera.name}
        draggable={true}
        onDragEnd={onDragEnd}
      >
        <div className="p-1.5 rounded-full bg-background border-2 border-primary cursor-grab active:cursor-grabbing">
            <Video className="h-5 w-5 text-primary" />
        </div>
      </AdvancedMarker>
    );
};

export default function PlanningPage() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [mapCenter, setMapCenter] = useState<Location>(MOCK_CENTER);
    const [mapZoom, setMapZoom] = useState(15);
    const { toast } = useToast();

    useEffect(() => {
        const savedCameras = localStorage.getItem(CAMERA_STORAGE_KEY);
        if (savedCameras) {
            try {
                const parsedCameras = JSON.parse(savedCameras);
                if (Array.isArray(parsedCameras) && parsedCameras.every(c => c.id && c.location)) {
                    setCameras(parsedCameras);
                } else {
                    setCameras(MOCK_CAMERAS);
                }
            } catch (error) {
                console.error("Failed to parse camera positions from localStorage", error);
                setCameras(MOCK_CAMERAS);
            }
        } else {
            setCameras(MOCK_CAMERAS);
        }
    }, []);

    const handleCameraMove = useCallback((cameraId: string, newLocation: Location) => {
        const updatedCameras = cameras.map(c => 
            c.id === cameraId ? { ...c, location: newLocation } : c
        );
        setCameras(updatedCameras);
        localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(updatedCameras));
        toast({
            title: "Camera Position Saved",
            description: `${cameras.find(c=>c.id === cameraId)?.name} has been moved.`,
        })
    }, [cameras, toast]);
    
    const handleResetLayout = () => {
        setCameras(MOCK_CAMERAS);
        localStorage.removeItem(CAMERA_STORAGE_KEY);
        toast({
            title: "Layout Reset",
            description: "Camera positions have been reset to the default layout.",
        });
    }

    if (!apiKey) {
        return (
          <div className="w-full h-screen bg-muted flex flex-col items-center justify-center p-4 text-center">
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Google Maps API Key is Missing</AlertTitle>
                <AlertDescription>
                    <p>To display the map, you need to add your Google Maps API key to the `.env` file.</p>
                </AlertDescription>
            </Alert>
          </div>
        );
    }

    return (
        <div className="h-screen w-screen flex">
            <div className="w-[380px] bg-card border-r border-border p-4 flex flex-col space-y-4">
                 <div className="flex items-center space-x-3 px-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="text-2xl font-headline font-bold text-foreground">Event Planner</h1>
                 </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Camera Placement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Drag and drop cameras on the map to plan their positions for the event.</p>
                        <ScrollArea className="h-[calc(100vh-300px)]">
                             <div className="space-y-2">
                                {cameras.map(camera => (
                                    <div key={camera.id} className="flex items-center gap-3 p-2 rounded-md border">
                                        <Video className="h-5 w-5 text-primary"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{camera.name}</p>
                                            <p className="text-xs text-muted-foreground">{`${camera.location.lat.toFixed(4)}, ${camera.location.lng.toFixed(4)}`}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                 </Card>
                 <div className="mt-auto">
                    <Button variant="outline" className="w-full" onClick={handleResetLayout}>Reset Layout</Button>
                 </div>
            </div>
            <div className="flex-1 h-full">
                <APIProvider apiKey={apiKey} libraries={['marker']}>
                    <Map
                        center={mapCenter}
                        zoom={mapZoom}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId={'drishti_dark_map'}
                        onCenterChanged={(e) => e.detail.center && setMapCenter(e.detail.center)}
                        onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                    >
                       {cameras.map(c => 
                            <CameraMarker 
                                key={`camera-${c.id}`} 
                                camera={c}
                                onDragEnd={(e) => {
                                    if(e.latLng) {
                                        handleCameraMove(c.id, e.latLng.toJSON())
                                    }
                                }}
                            />
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}

