
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Construction, Tent, Ambulance, TowerControl, Pin, Lightbulb, Loader, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSafetyPlan, type GenerateSafetyPlanOutput } from '@/ai/flows/generate-safety-plan-flow';
import { isGoogleMapsConfigured, getGoogleMapsApiKey } from '@/lib/config';
import { localStorage_getItem, localStorage_setItem, safeJsonParse, safeJsonStringify } from '@/lib/error-utils';

const MOCK_CENTER = { lat: 12.9716, lng: 77.5946 };

const assetLibrary = [
    { id: 'fixed-camera', name: 'Fixed Camera', icon: Camera },
    { id: 'ptz-camera', name: '360° PTZ Camera', icon: TowerControl },
    { id: 'barricade', name: 'Barricade', icon: Construction },
    { id: 'entrance', name: 'Entrance Gate', icon: Pin },
    { id: 'command-post', name: 'Command Post', icon: TowerControl },
    { id: 'first-aid', name: 'First Aid Tent', icon: Tent },
    { id: 'ambulance-staging', name: 'Ambulance Staging', icon: Ambulance },
];

const Asset = ({ asset, onDragStart }: { asset: any; onDragStart: (e: React.DragEvent, assetId: string) => void }) => {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, asset.id)}
        className="flex items-center p-2 border rounded-md cursor-grab bg-card hover:bg-muted"
      >
        <asset.icon className="w-5 h-5 mr-3 text-accent" />
        <span className="text-sm">{asset.name}</span>
      </div>
    );
};

const PlacedAssetMarker = ({ asset, onClick }: { asset: any; onClick: () => void }) => {
    const libraryItem = assetLibrary.find(item => item.id === asset.type);
    if (!libraryItem) return null;
    const Icon = libraryItem.icon;
    return (
        <AdvancedMarker position={asset.location} title={asset.label} onClick={onClick}>
            <div className="p-1.5 rounded-full bg-background border-2 border-accent cursor-pointer">
                <Icon className="w-5 h-5 text-accent" />
            </div>
        </AdvancedMarker>
    );
};

const Polygon = (props: google.maps.PolygonOptions) => {
    const map = useMap();
    const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);

    useEffect(() => {
        if (!map) return;
        if (!polygon) {
            setPolygon(new google.maps.Polygon());
        }
        return () => {
            if (polygon) {
                polygon.setMap(null);
            }
        };
    }, [map, polygon]);

    useEffect(() => {
        if (polygon) {
            polygon.setOptions(props);
            polygon.setMap(map);
        }
    }, [polygon, props, map]);

    return null;
};

const AiSuggestionHighlight = ({ center, radius, onClose }: { center: google.maps.LatLngLiteral, radius: number, onClose: ()=>void }) => {
    const map = useMap();
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    useEffect(() => {
        if(!map) return;
        if(!circle) {
            const c = new google.maps.Circle({
                strokeColor: "#FFC107",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FFC107",
                fillOpacity: 0.35,
                map,
                center: center,
                radius: radius,
            });
            setCircle(c);
        }
        return () => {
            if(circle){
                circle.setMap(null);
            }
        }
    }, [map, center, radius, circle]);

    return <InfoWindow position={center} onCloseClick={onClose}><p>Consider placing assets in this area.</p></InfoWindow>
}

function getStaticMapUrl(geofence: {lat: number, lng: number}[], apiKey: string) {
    if (!geofence || geofence.length === 0 || !apiKey) return '';
    const path = geofence.map(p => `${p.lat},${p.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/staticmap?size=640x480&path=color:0x4299E1ff|weight:2|fillcolor:0x4299E133|${path}&key=${apiKey}`;
    return url;
}


export function PlannerWorkspace({ planId }: { planId: string }) {
    const router = useRouter();
    const [planData, setPlanData] = useState<any>(null);
    const [placedAssets, setPlacedAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [mapCenter, setMapCenter] = useState(MOCK_CENTER);
    const [aiRecommendations, setAiRecommendations] = useState<GenerateSafetyPlanOutput['recommendations']>([]);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [highlight, setHighlight] = useState<{center: google.maps.LatLngLiteral, radius: number} | null>(null);
    const mapRef = React.useRef<google.maps.Map>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        
        let data: any = null;
        try {
            const dataStr = localStorage_getItem(`drishti-plan-${planId}`);
            const assetsStr = localStorage_getItem(`drishti-plan-assets-${planId}`);
            if (dataStr) {
                data = safeJsonParse(dataStr);
                if (data) {
                    setPlanData(data);
                    if (data.geofence && data.geofence.length > 0) {
                        const bounds = new window.google.maps.LatLngBounds();
                        data.geofence.forEach((p: any) => bounds.extend(p));
                        setMapCenter(bounds.getCenter().toJSON());
                    }
                }
            }
            if (assetsStr) {
                const assets = safeJsonParse(assetsStr);
                if (assets) {
                    setPlacedAssets(assets);
                }
            }
        } catch (error) {
            console.error("Failed to load plan data:", error);
            toast({ variant: 'destructive', title: "Could not load plan data." });
            return;
        }

        if (data && isGoogleMapsConfigured()) {
            setIsAiLoading(true);
            try {
                const apiKey = getGoogleMapsApiKey();
                const mapImageUrl = getStaticMapUrl(data.geofence, apiKey);
                
                generateSafetyPlan({
                    eventName: data.eventName,
                    eventType: data.eventType,
                    peakAttendance: data.peakAttendance,
                    vipPresence: data.vipPresence,
                    eventSentiment: data.eventSentiment,
                    securityConcerns: data.securityConcerns,
                    mapImageUrl: mapImageUrl
                }).then(response => {
                    setAiRecommendations(response.recommendations || []);
                }).catch(err => {
                    console.error("AI recommendation error:", err);
                    toast({ variant: 'destructive', title: 'Could not get AI recommendations.', description: 'The AI service may be temporarily unavailable.' });
                }).finally(() => {
                    setIsAiLoading(false);
                });
            } catch (error) {
                console.error("Failed to get API key or generate map:", error);
                setIsAiLoading(false);
                toast({ variant: 'destructive', title: 'Configuration Error', description: 'Failed to load map configuration.' });
            }
        } else {
             setIsAiLoading(false);
             if (!isGoogleMapsConfigured()) {
                toast({ variant: 'destructive', title: 'Google Maps API Key is missing.', description: 'Please configure your API key to use this feature.' });
             }
        }

    }, [planId, toast, isMounted]);

    const saveAssets = (newAssets: any[]) => {
        setPlacedAssets(newAssets);
        localStorage.setItem(`drishti-plan-assets-${planId}`, JSON.stringify(newAssets));
    }

    const handleDragStart = (e: React.DragEvent, assetId: string) => {
        e.dataTransfer.setData('assetId', assetId);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const assetId = e.dataTransfer.getData('assetId');
        // @ts-ignore
        const map = mapRef.current;
        if (!assetId || !map) {
            toast({ variant: 'destructive', title: 'Drop failed', description: 'Unable to place asset at this location.' });
            return;
        }
        
        const mapContainer = map.getDiv();
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        try {
            // This is a deprecated method but easier to use without the full map instance.
            // For a more robust solution, we'd use a different approach with the map instance.
            const projection = map.getProjection();
            if (!projection) {
                throw new Error('Map projection not available');
            }
            
            const ne = projection.fromContainerPixelToLatLng(new google.maps.Point(x, y));
            
            if (ne) {
                const assetType = assetLibrary.find(a => a.id === assetId);
                const newAsset = {
                    id: `asset-${Date.now()}`,
                    type: assetId,
                    label: `${assetType?.name || 'Asset'} ${placedAssets.length + 1}`,
                    notes: '',
                    location: ne.toJSON(),
                };
                saveAssets([...placedAssets, newAsset]);
                toast({ title: "Asset Placed", description: `${newAsset.label} added to the map.`});
            }
        } catch (error) {
            console.error('Error placing asset:', error);
            toast({ variant: 'destructive', title: 'Failed to place asset', description: 'Could not determine map coordinates.' });
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleUpdateAsset = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedAsset) return;
        
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const label = formData.get('label') as string;
            const notes = formData.get('notes') as string;
            
            if (!label.trim()) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'Asset label cannot be empty.' });
                return;
            }
            
            const updatedAsset = {
                ...selectedAsset,
                label: label.trim(),
                notes: notes.trim(),
            };
            const newAssets = placedAssets.map(a => a.id === selectedAsset.id ? updatedAsset : a);
            saveAssets(newAssets);
            setSelectedAsset(null);
            toast({ title: "Asset Updated", description: "Asset details have been saved successfully." });
        } catch (error) {
            console.error('Error updating asset:', error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update asset details.' });
        }
    }
    
    const handleProceedToBriefing = () => {
        saveAssets(placedAssets); // Ensure everything is saved
        router.push(`/planning/${planId}/briefing`);
    }

    const handleAiAction = (rec: GenerateSafetyPlanOutput['recommendations'][0]) => {
        if (!planData?.geofence || planData.geofence.length === 0) {
            toast({ variant: 'destructive', title: 'Geofence not set', description: 'Please define a geofence first.' });
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        planData.geofence.forEach((p: any) => bounds.extend(p));
        const center = bounds.getCenter();
        
        // Simple mock logic to highlight a random point within the geofence
        const lat = center.lat() + (Math.random() - 0.5) * 0.002;
        const lng = center.lng() + (Math.random() - 0.5) * 0.002;

        setHighlight({ center: { lat, lng }, radius: 100 });
        if(mapRef.current) {
            // @ts-ignore
            mapRef.current.panTo({ lat, lng });
            // @ts-ignore
            mapRef.current.setZoom(17);
        }

    }

    if (!apiKey) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Configuration Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p>Google Maps API Key is missing.</p>
                            <pre className="bg-muted p-2 rounded text-xs">
                                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
                            </pre>
                            <p className="text-sm text-muted-foreground">
                                Add this to your environment configuration.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!planData) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading plan data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
            <div className="flex-1 h-full relative">
                <APIProvider apiKey={apiKey}>
                    <Map
                        // @ts-ignore
                        ref={mapRef}
                        center={mapCenter}
                        defaultZoom={15}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId={'drishti_dark_map'}
                    >
                        {planData.geofence && (
                            <Polygon
                                paths={planData.geofence}
                                fillColor="#4299E1"
                                fillOpacity={0.2}
                                strokeColor="#4299E1"
                                strokeWeight={2}
                            />
                        )}
                        {placedAssets.map(asset => (
                            <PlacedAssetMarker key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                        ))}
                        {highlight && (
                            <AiSuggestionHighlight 
                                center={highlight.center} 
                                radius={highlight.radius} 
                                onClose={() => setHighlight(null)} 
                            />
                        )}
                    </Map>
                </APIProvider>
            </div>
            <aside className="w-[380px] bg-card border-l border-border flex flex-col h-full">
                <Tabs defaultValue="library" className="flex-1 flex flex-col h-full overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="library">Asset Library</TabsTrigger>
                        <TabsTrigger value="ai">Drishti AI</TabsTrigger>
                    </TabsList>
                    <TabsContent value="library" className="flex-1 p-4 space-y-3 overflow-y-auto">
                         {assetLibrary.map(asset => (
                            <Asset key={asset.id} asset={asset} onDragStart={handleDragStart} />
                         ))}
                    </TabsContent>
                    <TabsContent value="ai" className="flex-1 p-4 space-y-3 overflow-y-auto">
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center"><Lightbulb className="w-5 h-5 mr-2 text-yellow-400" /> AI Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isAiLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader className="w-6 h-6 animate-spin" />
                                        <p className="ml-3 text-sm text-muted-foreground">Analyzing your plan...</p>
                                    </div>
                                ) : aiRecommendations.length > 0 ? (
                                    aiRecommendations.map((rec, index) => (
                                         <div key={index} className="p-3 rounded-md border bg-card">
                                            <p className="font-semibold text-sm">{rec.title}</p>
                                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{rec.description}</p>
                                            {rec.action && <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => handleAiAction(rec)}>{rec.action}</Button>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-muted-foreground">No specific AI recommendations based on your intake.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <div className="p-4 border-t">
                    <Button className="w-full" size="lg" onClick={handleProceedToBriefing}>
                        Generate Briefing
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </aside>
            <Dialog open={!!selectedAsset} onOpenChange={(isOpen) => !isOpen && setSelectedAsset(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asset Properties</DialogTitle>
                        <DialogDescription>
                            Configure the details for your placed asset.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAsset}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="asset-label">Label</Label>
                                <Input id="asset-label" name="label" defaultValue={selectedAsset?.label} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="asset-notes">Notes</Label>
                                <Textarea id="asset-notes" name="notes" defaultValue={selectedAsset?.notes} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" type="button" onClick={() => setSelectedAsset(null)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
