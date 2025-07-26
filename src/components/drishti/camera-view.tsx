'use client';

import { useState, useEffect, useRef } from 'react';
import type { Camera } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Image from 'next/image';
import { Expand, Video } from 'lucide-react';
import { Button } from '../ui/button';

const MOCK_CAMERAS: Camera[] = Array.from({ length: 3 }, (_, i) => ({
    id: `cam-0${i + 1}`,
    name: `Camera Feed ${i + 1}`,
    location: `Zone ${String.fromCharCode(65 + i)}`,
    streamUrl: `https://placehold.co/640x480.png?text=Live+Feed+${i+1}`,
}));


export default function CameraView() {
  const [cameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div >
                <CardTitle className="text-base font-semibold">{camera.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{camera.location}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedCamera(camera)}>
                  <Expand className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <AspectRatio ratio={16 / 9} className="bg-muted">
                  <Image
                    src={camera.streamUrl}
                    alt={camera.name}
                    fill
                    className="object-cover"
                    data-ai-hint="security camera"
                  />
              </AspectRatio>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedCamera} onOpenChange={(isOpen) => !isOpen && setSelectedCamera(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCamera?.name}</DialogTitle>
            <DialogDescription>{selectedCamera?.location}</DialogDescription>
          </DialogHeader>
          {selectedCamera && (
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                 <Image
                    src={selectedCamera.streamUrl.replace('640x480', '1280x720')}
                    alt={selectedCamera.name}
                    fill
                    className="object-cover"
                    data-ai-hint="security camera"
                />
            </AspectRatio>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
