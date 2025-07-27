'use client';

import { type Camera } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8001'; // Default to localhost if not set
const HTTP_ENDPOINT = `${API_HOST}/camera_metrics`;

export default function CameraGrid({ cameras, onHeatmapUpdate }: CameraGridProps) {
  const [crowdCounts, setCrowdCounts] = useState<CrowdCountData>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(HTTP_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CrowdCountData = await response.json();
        console.log('Fetched crowd data:', data); // Added log
        
        // Map the incoming data keys (streamUrl filenames) to camera IDs
        const mappedCrowdCounts: CrowdCountData = {};
        Object.keys(data).forEach(streamFileName => {
            // Extract filename from camera.streamUrl for a more robust match
            const camera = cameras.find(c => {
                const urlParts = c.streamUrl.split('/');
                const cameraFileName = urlParts[urlParts.length - 1];
                return cameraFileName === streamFileName;
            });
            if (camera) {
                mappedCrowdCounts[camera.id] = data[streamFileName];
            }
        });
        setCrowdCounts(mappedCrowdCounts);

        const heatmapPoints: HeatmapPoint[] = Object.keys(mappedCrowdCounts) // Use mappedCrowdCounts for heatmap points
          .map(cameraId => {
            const camera = cameras.find(c => c.id === cameraId);
            if (camera) {
              return { lat: camera.location.lat, lng: camera.location.lng, weight: mappedCrowdCounts[cameraId] };
            } else {
              return null;
            }
          })
          .filter((p): p is HeatmapPoint => p !== null);
        console.log('Generated heatmap points:', heatmapPoints); // Added log
        onHeatmapUpdate(heatmapPoints);

      } catch (error) {
        console.error('Error fetching crowd data:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch crowd data from ${HTTP_ENDPOINT}.`,
          variant: 'destructive',
        });
      }
    };

    // Fetch data immediately on mount
    fetchData();

    // Set up interval to fetch data every 5 seconds for diagnostic purposes
    const intervalId = setInterval(fetchData, 5000); // Changed from 15 seconds to 5 seconds

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [cameras, onHeatmapUpdate, toast]); // Dependencies: cameras (to find GPS), onHeatmapUpdate (to pass data up), toast

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cameras.map(camera => (
        <Card key={camera.id}>
          <CardHeader>
            <CardTitle>{camera.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-48 bg-gray-900 flex items-center justify-center text-gray-500 overflow-hidden">
              {camera.streamUrl ? (
                <video src={camera.streamUrl} autoPlay loop muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">No Video Stream Available</div>
              )}
            </div>
            <div className="mt-2">
              <strong>Crowd Count:</strong>{' '}
              {crowdCounts[camera.id] !== undefined ? crowdCounts[camera.id] : 'Loading...'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}