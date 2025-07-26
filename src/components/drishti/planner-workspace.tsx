
'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
import { Camera, Construction, Tent, Ambulance, TowerControl, Pin, Lightbulb, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSafetyPlan, type GenerateSafetyPlanOutput } from '@/ai/flows/generate-safety-plan-flow';

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


export function PlannerWorkspace({ planId }: { planId: string }) {
    const [planData, setPlanData] = useState<any>(null);
    const [placedAssets, setPlacedAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [mapCenter, setMapCenter] = useState(MOCK_CENTER);
    const [aiRecommendations, setAiRecommendations] = useState<GenerateSafetyPlanOutput['recommendations']>([]);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [highlight, setHighlight] = useState<{center: google.maps.LatLngLiteral, radius: number} | null>(null);
    const mapRef = React.useRef<google.maps.Map>(null);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const { toast } = useToast();

    useEffect(() => {
        let data: any = null;
        try {
            const dataStr = localStorage.getItem(`drishti-plan-${planId}`);
            const assetsStr = localStorage.getItem(`drishti-plan-assets-${planId}`);
            if (dataStr) {
                data = JSON.parse(dataStr);
                setPlanData(data);
                if (data.geofence && data.geofence.length > 0) {
                    const bounds = new window.google.maps.LatLngBounds();
                    data.geofence.forEach((p: any) => bounds.extend(p));
                    setMapCenter(bounds.getCenter().toJSON());
                }
            }
            if(assetsStr) {
                setPlacedAssets(JSON.parse(assetsStr));
            }
        } catch (e) {
            toast({ variant: 'destructive', title: "Could not load plan data." });
            return;
        }

        if (data) {
            setIsAiLoading(true);
            generateSafetyPlan({
                eventName: data.eventName,
                eventType: data.eventType,
                peakAttendance: data.peakAttendance,
                vipPresence: data.vipPresence,
                eventSentiment: data.eventSentiment,
                securityConcerns: data.securityConcerns,
            }).then(response => {
                setAiRecommendations(response.recommendations);
            }).catch(err => {
                console.error("AI recommendation error:", err);
                toast({ variant: 'destructive', title: 'Could not get AI recommendations.'});
            }).finally(() => {
                setIsAiLoading(false);
            });
        } else {
             setIsAiLoading(false);
        }

    }, [planId, toast]);

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
        if (!assetId || !map) return;
        
        const mapContainer = map.getDiv();
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const projection = map.getProjection();
        const ne = projection?.fromContainerPixelToLatLng(new google.maps.Point(x, y));
        
        if (ne) {
            const newAsset = {
                id: `asset-${Date.now()}`,
                type: assetId,
                label: `${assetLibrary.find(a=>a.id === assetId)?.name} ${placedAssets.length + 1}`,
                notes: '',
                location: ne.toJSON(),
            };
            saveAssets([...placedAssets, newAsset]);
            toast({ title: "Asset Placed", description: `${newAsset.label} added to the map.`});
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleUpdateAsset = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedAsset) return;
        const formData = new FormData(e.target as HTMLFormElement);
        const updatedAsset = {
            ...selectedAsset,
            label: formData.get('label') as string,
            notes: formData.get('notes') as string,
        };
        const newAssets = placedAssets.map(a => a.id === selectedAsset.id ? updatedAsset : a);
        saveAssets(newAssets);
        setSelectedAsset(null);
        toast({ title: "Asset Updated" });
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

    if (!apiKey) return <div>Missing Google Maps API Key</div>;
    if (!planData) return <div>Loading plan...</div>;

    return (
        <div className="flex-1 flex h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
            <div className="flex-1 h-full relative">
                <APIProvider apiKey={apiKey}>
                    <Map
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
                                            <p className="text-xs text-muted-foreground">{rec.description}</p>
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
