'use client';

import { type Camera } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle } from 'lucide-react';

interface CameraGridProps {
  cameras: Camera[];
  onHeatmapUpdate: (points: HeatmapPoint[]) => void;
}

interface CrowdCountData {
  [cameraId: string]: number; // cameraId will be like "cam_angle1.mp4"
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

const WEBSOCKET_ENDPOINT = 'ws://localhost:8001/'; // WebSocket endpoint

export default function CameraGrid({ cameras, onHeatmapUpdate }: CameraGridProps) {
  const [crowdCounts, setCrowdCounts] = useState<CrowdCountData>({});
  const { toast } = useToast();
  const websocketRef = useRef<WebSocket | null>(null);

  // --- WebSocket Logic ---
  useEffect(() => {
    console.log('Attempting to connect to WebSocket:', WEBSOCKET_ENDPOINT);
    // Connect to the WebSocket
    websocketRef.current = new WebSocket(WEBSOCKET_ENDPOINT);

    websocketRef.current.onopen = () => {
      console.log('WebSocket connection established successfully.');
    };

    // Handle incoming messages
    websocketRef.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data: CrowdCountData = JSON.parse(event.data);
        console.log('Parsed crowd data:', data);
        setCrowdCounts(data);

        // Map the crowd count data to heatmap points using camera GPS coordinates
        const heatmapPoints: HeatmapPoint[] = Object.keys(data)
          .map(cameraId => {
            // Find the corresponding camera object using the cameraId (e.g., "cam_angle1.mp4")
            const camera = cameras.find(c => c.id === cameraId);
            // If camera is found, create a HeatmapPoint
            if (camera) {
              console.log(`Mapping camera ${cameraId} (lat: ${camera.gps.lat}, lng: ${camera.gps.lng}) with weight ${data[cameraId]}`);
              return { lat: camera.gps.lat, lng: camera.gps.lng, weight: data[cameraId] };
            } else {
              console.warn(`Camera with ID "${cameraId}" not found in provided cameras list. Skipping heatmap point.`);
              return null;
            }
          })
          .filter((p): p is HeatmapPoint => p !== null); // Filter out any nulls (cameras not found)

        onHeatmapUpdate(heatmapPoints);
        console.log('Heatmap points updated:', heatmapPoints);

      } catch (error) {
        console.error('Error parsing websocket message:', error);
        toast({
          title: 'Error',
          description: 'Failed to process crowd data from websocket.',
          variant: 'destructive',
        });
      }
    };

    // Handle WebSocket errors
    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error occurred:', error);
      toast({
        title: 'Error',
        description: 'WebSocket connection error.',
        variant: 'destructive',
      });
    };

    // Handle WebSocket closure
    websocketRef.current.onclose = (event) => {
      console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
      if (!event.wasClean) {
        console.warn('WebSocket connection was not closed cleanly.');
      }
      // Optionally, implement reconnect logic here if needed
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      console.log('Cleaning up WebSocket connection...');
      websocketRef.current?.close();
    };
  }, [cameras, onHeatmapUpdate, toast]); // Dependencies: cameras (to find GPS), onHeatmapUpdate (to pass data up), toast

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cameras.map(camera => (
        <Card key={camera.id}>
          <CardHeader>
            <CardTitle>{camera.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for video feed or image - This part remains unchanged as per your original code */}
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
              Video Feed / Image Placeholder
            </div>
            <div className="mt-2">
              <strong>Crowd Count:</strong>{' '}
              {crowdCounts[camera.id] !== undefined ? crowdCounts[camera.id] : 'Loading...'}
            </div>
            {camera.status === 'alert' && (
              <div className="mt-2 text-yellow-600 flex items-center">
                <AlertTriangle className="mr-1 w-5 h-5" />
                <span>Incident Detected</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}