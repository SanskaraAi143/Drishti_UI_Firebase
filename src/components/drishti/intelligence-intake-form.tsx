
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

const MOCK_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru

const intakeSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters.'),
  eventType: z.string().min(1, 'Please select an event type.'),
  // Dates will be handled separately
  venueAddress: z.string().min(5, 'Venue address is required.'),
  geofence: z.any().refine(val => val && val.length > 2, { message: "Please draw a geofence on the map." }),
  peakAttendance: z.number().min(1),
  vipPresence: z.boolean(),
  vipDetails: z.string().optional(),
  eventSentiment: z.string().min(1, 'Please select the event sentiment.'),
  securityConcerns: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one security concern.",
  }),
});

const securityConcernsList = [
    { id: 'crowdControl', label: 'Crowd Control & Surge Risk' },
    { id: 'medical', label: 'Medical Emergencies (e.g., Heat, Substance Use)' },
    { id: 'targetedThreat', label: 'Targeted Threat to VIP/Event' },
    { id: 'externalAgitators', label: 'External Agitators / Counter-Protests' },
    { id: 'perimeterBreach', label: 'Unsanctioned Access / Perimeter Breach' },
]

const GeofenceMap = ({ onGeofenceChange }: { onGeofenceChange: (path: any) => void }) => {
    const map = useMap();
    const drawingLibrary = useMapsLibrary('drawing');
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);

    useEffect(() => {
        if (!map || !drawingLibrary) return;

        const manager = new drawingLibrary.DrawingManager({
            map,
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
                fillColor: '#4299E1',
                fillOpacity: 0.3,
                strokeWeight: 3,
                strokeColor: '#4299E1',
                clickable: false,
                editable: true,
                zIndex: 1,
            },
        });
        setDrawingManager(manager);

        google.maps.event.addListener(manager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
            const path = polygon.getPath().getArray().map(p => p.toJSON());
            onGeofenceChange(path);
            manager.setDrawingMode(null); // Exit drawing mode
        });

        return () => {
            if (manager) {
              manager.setMap(null);
            }
        };
    }, [map, drawingLibrary, onGeofenceChange]);

    return null;
}

export function IntelligenceIntakeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(intakeSchema),
    mode: 'onChange',
    defaultValues: {
        eventName: '',
        eventType: '',
        venueAddress: '',
        geofence: null,
        peakAttendance: 5000,
        vipPresence: false,
        vipDetails: '',
        eventSentiment: '',
        securityConcerns: [],
    }
  });

  const vipPresence = watch('vipPresence');

  const onSubmit = (data: z.infer<typeof intakeSchema>) => {
    console.log(data);
    const newPlanId = `plan-${Date.now()}`;
    // In a real app, you would save this data to a backend.
    // We'll simulate this by storing it in localStorage for now.
    try {
        localStorage.setItem(`drishti-plan-${newPlanId}`, JSON.stringify(data));
        toast({
            title: "Plan Created Successfully",
            description: "Proceeding to the Planner Workspace.",
        });
        router.push(`/planning/${newPlanId}/edit`);
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Failed to save plan",
            description: "Could not save plan data to local storage.",
        });
    }
  };

  if (!apiKey) {
      return <div>API Key for Google Maps is missing.</div>
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">New Safety Plan: Intelligence Intake</CardTitle>
        <CardDescription>Gather foundational intelligence to build a data-driven security plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Section 1: Event Fundamentals</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input id="eventName" {...register('eventName')} placeholder="e.g., Annual Music Fest 2024" />
                  {errors.eventName && <p className="text-sm text-destructive">{errors.eventName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Controller
                    name="eventType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="political-rally">Political Rally</SelectItem>
                          <SelectItem value="music-festival">Music Festival</SelectItem>
                          <SelectItem value="sporting-event">Sporting Event</SelectItem>
                          <SelectItem value="parade">Parade</SelectItem>
                          <SelectItem value="public-protest">Public Protest</SelectItem>
                          <SelectItem value="corporate-event">Corporate Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                   {errors.eventType && <p className="text-sm text-destructive">{errors.eventType.message}</p>}
                </div>
                {/* Date/Time picker would be implemented here */}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Section 2: Venue & Scope Definition</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Input id="venueAddress" {...register('venueAddress')} placeholder="e.g., M.G. Road, Bengaluru" />
                    {errors.venueAddress && <p className="text-sm text-destructive">{errors.venueAddress.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Define Event Perimeter (Geofence)</Label>
                    <div className="h-96 w-full rounded-md overflow-hidden border">
                         <APIProvider apiKey={apiKey} libraries={['drawing']}>
                            <Map
                                defaultCenter={MOCK_CENTER}
                                defaultZoom={13}
                                gestureHandling={'greedy'}
                                mapId={'drishti_dark_map'}
                            >
                               <GeofenceMap onGeofenceChange={(path) => setValue('geofence', path, { shouldValidate: true })} />
                            </Map>
                        </APIProvider>
                    </div>
                     {errors.geofence && <p className="text-sm text-destructive">{errors.geofence.message}</p>}
                 </div>
                 <div className="space-y-2">
                    <Label>Expected Peak Attendance: {watch('peakAttendance').toLocaleString()}</Label>
                    <Controller
                        name="peakAttendance"
                        control={control}
                        render={({ field }) => (
                            <Slider
                                defaultValue={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={100}
                                max={100000}
                                step={100}
                            />
                        )}
                    />
                 </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Section 3: Threat & Crowd Profile Assessment</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="flex items-center space-x-2">
                    <Controller
                        name="vipPresence"
                        control={control}
                        render={({ field }) => (
                            <Switch id="vipPresence" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <Label htmlFor="vipPresence">VIP / High-Profile Individual Presence</Label>
                </div>
                {vipPresence && (
                    <div className="space-y-2">
                        <Label htmlFor="vipDetails">VIP Details & Specific Protection Needs</Label>
                        <Textarea id="vipDetails" {...register('vipDetails')} />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Overall Event Sentiment</Label>
                    <Controller
                        name="eventSentiment"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select sentiment" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="celebratory">Celebratory</SelectItem>
                                    <SelectItem value="neutral">Neutral</SelectItem>
                                    <SelectItem value="controversial">Controversial</SelectItem>
                                    <SelectItem value="high-tension">High-Tension</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.eventSentiment && <p className="text-sm text-destructive">{errors.eventSentiment.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Anticipated Primary Security Concerns</Label>
                    <Controller
                        name="securityConcerns"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                            {securityConcernsList.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={item.id}
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(field.value?.filter(value => value !== item.id))
                                    }}
                                />
                                <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
                                </div>
                            ))}
                            </div>
                        )}
                    />
                    {errors.securityConcerns && <p className="text-sm text-destructive">{errors.securityConcerns.message}</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-8 flex justify-end">
            <Button type="submit" size="lg" disabled={!isValid}>
              Save & Proceed to Planner Workspace
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
