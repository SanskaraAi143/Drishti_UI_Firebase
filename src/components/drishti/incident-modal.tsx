
'use client';

import type { Incident, Route } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MapPin, Clock, ShieldAlert, Wifi, Route as RouteIcon, ExternalLink, StepForward, Timer, Milestone } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface IncidentModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDispatch: () => void;
  route: Route | null;
}

export default function IncidentModal({ incident, isOpen, onOpenChange, onDispatch, route }: IncidentModalProps) {
  const { toast } = useToast();

  if (!incident) return null;

  const handleDispatch = () => {
    // For high severity, trigger the route calculation via the onDispatch prop
    if (incident.type === 'Altercation' || incident.severity === 'High') {
      onDispatch();
    } else {
      toast({
        title: 'Unit Dispatched',
        description: `Nearest unit has been dispatched to ${incident.type.replace(/([A-Z])/g, ' $1').trim()}.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={route ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center">
            <ShieldAlert className="w-6 h-6 mr-3 text-accent" />
            Incident Details: {incident.type.replace(/([A-Z])/g, ' $1').trim()}
          </DialogTitle>
          <DialogDescription>{incident.description}</DialogDescription>
        </DialogHeader>
        <div className={`grid ${route ? 'grid-cols-2 gap-8' : 'grid-cols-1'} py-4`}>
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Time Reported</p>
                  <p className="text-sm text-muted-foreground">{format(incident.timestamp, 'PPpp')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-sm text-muted-foreground">{`${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)}`}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Wifi className="w-5 h-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Source</p>
                  <p className="text-sm text-muted-foreground">{incident.source}</p>
                </div>
              </div>
            </div>
            {route && (
                <div className="border-l pl-8">
                    <h4 className="font-headline text-lg flex items-center mb-4">
                        <RouteIcon className="w-5 h-5 mr-3 text-accent"/>
                        Fastest Route
                    </h4>
                    <div className="flex justify-between items-center text-sm mb-4">
                        <div className="flex items-center gap-2">
                            <Milestone className="w-4 h-4 text-muted-foreground"/>
                            <span>{route.distance}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-muted-foreground"/>
                            <span>{route.duration}</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <a href={route.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2"/>
                                Open in Maps
                            </a>
                        </Button>
                    </div>

                    <ScrollArea className="h-48 pr-4">
                        <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-4">
                            {route.steps.map((step, index) => (
                                <li key={index} className="ml-6">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                                       <StepForward className="w-3 h-3 text-blue-800 dark:text-blue-300"/>
                                    </span>
                                    <div className="bg-muted/50 p-2 rounded-md">
                                      <p className="text-sm font-normal text-foreground" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                                      <p className="text-xs text-muted-foreground">{step.distance} ({step.duration})</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </ScrollArea>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDispatch}>Dispatch Nearest Unit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
