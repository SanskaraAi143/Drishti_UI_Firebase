'use client';

import type { Incident } from '@/lib/types';
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
import { MapPin, Clock, ShieldAlert, Wifi } from 'lucide-react';

interface IncidentModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IncidentModal({ incident, isOpen, onOpenChange }: IncidentModalProps) {
  const { toast } = useToast();

  if (!incident) return null;

  const handleDispatch = () => {
    toast({
      title: 'Unit Dispatched',
      description: `Nearest unit has been dispatched to ${incident.type.replace(/([A-Z])/g, ' $1').trim()}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center">
            <ShieldAlert className="w-6 h-6 mr-3 text-accent" />
            Incident Details: {incident.type.replace(/([A-Z])/g, ' $1').trim()}
          </DialogTitle>
          <DialogDescription>{incident.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDispatch}>Dispatch Nearest Unit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
