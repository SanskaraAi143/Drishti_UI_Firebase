
'use client';
import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Polygon, useMap } from '@vis.gl/react-google-maps';
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
import { Camera, Barricade, Tent, Ambulance, TowerControl, Pin, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOCK_CENTER = { lat: 12.9716, lng: 77.5946 };

const assetLibrary = [
    { id: 'fixed-camera', name: 'Fixed Camera', icon: Camera },
    { id: 'ptz-camera', name: '360° PTZ Camera', icon: TowerControl },
    { id: 'barricade', name: 'Barricade', icon: Barricade },
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

export function PlannerWorkspace({ planId }: { planId: string }) {
    const [planData, setPlanData] = useState<any>(null);
    const [placedAssets, setPlacedAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [mapCenter, setMapCenter] = useState(MOCK_CENTER);
    const [mapZoom, setMapZoom] = useState(15);
    const mapRef = React.useRef<google.maps.Map>(null);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const { toast } = useToast();

    useEffect(() => {
        try {
            const data = localStorage.getItem(`drishti-plan-${planId}`);
            const assets = localStorage.getItem(`drishti-plan-assets-${planId}`);
            if (data) {
                const parsedData = JSON.parse(data);
                setPlanData(parsedData);
                if (parsedData.geofence && parsedData.geofence.length > 0) {
                    const bounds = new window.google.maps.LatLngBounds();
                    parsedData.geofence.forEach((p: any) => bounds.extend(p));
                    // The map instance isn't available immediately. This is a common issue.
                    // We'll set the center from the geofence data.
                    setMapCenter(bounds.getCenter().toJSON());
                }
            }
            if(assets) {
                setPlacedAssets(JSON.parse(assets));
            }
        } catch (e) {
            toast({ variant: 'destructive', title: "Could not load plan data." });
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
        
        const point = { x: e.clientX, y: e.clientY };
        const latLng = map.getProjection()?.fromPointToLatLng(point);
        
        if (latLng) {
            const newAsset = {
                id: `asset-${Date.now()}`,
                type: assetId,
                label: `${assetLibrary.find(a=>a.id === assetId)?.name} ${placedAssets.length + 1}`,
                notes: '',
                location: latLng.toJSON(),
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

    if (!apiKey) return <div>Missing Google Maps API Key</div>;
    if (!planData) return <div>Loading plan...</div>;

    return (
        <div className="flex-1 flex" onDrop={handleDrop} onDragOver={handleDragOver}>
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
                    </Map>
                </APIProvider>
            </div>
            <aside className="w-[380px] bg-card border-l border-border flex flex-col">
                <Tabs defaultValue="library" className="flex-1 flex flex-col">
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
                                {planData.vipPresence && (
                                    <div className="p-3 rounded-md border bg-card">
                                        <p className="font-semibold text-sm">VIP Ingress/Egress Coverage</p>
                                        <p className="text-xs text-muted-foreground">Ensure 360° camera coverage on the stage and all VIP routes.</p>
                                        <Button size="sm" variant="link" className="p-0 h-auto mt-1">Highlight Zones</Button>
                                    </div>
                                )}
                                {planData.securityConcerns.includes('crowdControl') && (
                                     <div className="p-3 rounded-md border bg-card">
                                        <p className="font-semibold text-sm">Crowd Control Measures</p>
                                        <p className="text-xs text-muted-foreground">Use barricades for serpentine queues at entrances. Map is highlighting potential choke points.</p>
                                        <Button size="sm" variant="link" className="p-0 h-auto mt-1">View Choke Points</Button>
                                    </div>
                                )}
                                <p className="text-center text-xs text-muted-foreground">AI analysis based on your intelligence intake.</p>
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
