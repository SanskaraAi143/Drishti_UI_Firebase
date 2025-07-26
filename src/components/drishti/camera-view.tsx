
'use client';

import { useState } from 'react';
import type { Camera } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Image from 'next/image';
import { Expand } from 'lucide-react';
import { Button } from '../ui/button';

interface CameraViewProps {
    cameras: Camera[];
    isCommanderAtJunctionA: boolean;
}

export default function CameraView({ cameras, isCommanderAtJunctionA }: CameraViewProps) {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  const renderCameraFeed = (camera: Camera) => {
    switch(camera.id) {
        case 'cam-a':
            return isCommanderAtJunctionA ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg font-semibold">Commander Arrived</p>
                </div>
              ) : (
                <video
                  src="https://storage.googleapis.com/event_safety/Crowd%20Detection.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              );
        case 'cam-b':
            return (
                <video
                  src="https://storage.googleapis.com/event_safety/Anamoly.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
            );
        default:
            return (
                <Image
                    src={camera.streamUrl}
                    alt={camera.name}
                    fill
                    className="object-cover"
                    data-ai-hint="security camera"
                />
            );
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div >
                <CardTitle className="text-base font-semibold">{camera.name}</CardTitle>
                 <p className="text-sm text-muted-foreground">{`${camera.location.lat.toFixed(4)}, ${camera.location.lng.toFixed(4)}`}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedCamera(camera)}>
                  <Expand className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <AspectRatio ratio={16 / 9} className="bg-muted">
                {renderCameraFeed(camera)}
              </AspectRatio>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedCamera} onOpenChange={(isOpen) => !isOpen && setSelectedCamera(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCamera?.name}</DialogTitle>
            <DialogDescription>{selectedCamera?.location ? `${selectedCamera.location.lat.toFixed(4)}, ${selectedCamera.location.lng.toFixed(4)}`: ''}</DialogDescription>
          </DialogHeader>
          {selectedCamera && (
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                 {selectedCamera.id === 'cam-b' ? 
                    <video
                        src="https://storage.googleapis.com/event_safety/Anamoly.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    /> :
                    <Image
                        src={selectedCamera.streamUrl.replace('640x480', '1280x720')}
                        alt={selectedCamera.name}
                        fill
                        className="object-cover"
                        data-ai-hint="security camera"
                    />
                 }
            </AspectRatio>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

