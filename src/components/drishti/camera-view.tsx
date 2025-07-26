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
import { Camera as CameraIcon, Expand, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const MOCK_CAMERAS: Camera[] = [
    { id: 'cam-01', name: 'Live Feed (Webcam)', location: 'Your Location', streamUrl: 'live' },
    ...Array.from({ length: 3 }, (_, i) => ({
        id: `cam-0${i + 2}`,
        name: `Camera Feed ${i + 2}`,
        location: `Zone ${String.fromCharCode(65 + (i % 3))}`,
        streamUrl: `https://placehold.co/640x480.png?text=Live+Feed+${i+2}`,
    }))
];


export default function CameraView() {
  const [cameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      } else {
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access.',
          });
      }
    };

    getCameraPermission();

    return () => {
        if(videoRef.current && videoRef.current.srcObject){
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);


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
                {camera.streamUrl === 'live' ? (
                  <div className="w-full h-full flex flex-col justify-center items-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
                            <Alert variant="destructive">
                                <Video className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access to use this feature. Check your browser settings.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                     {hasCameraPermission === null && (
                         <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-white">
                            <p>Requesting camera permission...</p>
                        </div>
                    )}
                  </div>
                ) : (
                  <Image
                    src={camera.streamUrl}
                    alt={camera.name}
                    fill
                    className="object-cover"
                    data-ai-hint="security camera"
                  />
                )}
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
                {selectedCamera.streamUrl === 'live' && hasCameraPermission ? (
                     <video src={videoRef.current?.srcObject ? undefined : ''} ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : selectedCamera.streamUrl === 'live' && !hasCameraPermission ? (
                     <div className="w-full h-full flex flex-col justify-center items-center p-4">
                         <Alert variant="destructive">
                             <Video className="h-4 w-4" />
                             <AlertTitle>Camera Access Denied</AlertTitle>
                             <AlertDescription>
                                 Cannot show enlarged live feed without camera permission.
                             </AlertDescription>
                         </Alert>
                     </div>
                ) : (
                     <Image
                        src={selectedCamera.streamUrl.replace('640x480', '1280x720')}
                        alt={selectedCamera.name}
                        fill
                        className="object-cover"
                        data-ai-hint="security camera"
                    />
                )}
            </AspectRatio>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
