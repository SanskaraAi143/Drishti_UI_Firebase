
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, MapPin, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

// Mock data, in a real app this would be fetched based on planId
const MOCK_PLAN_DATA = {
    eventName: 'Annual Music Fest 2024',
    eventType: 'Music Festival',
    peakAttendance: 50000,
    vipPresence: true,
    eventSentiment: 'Celebratory',
    securityConcerns: ['Crowd Control & Surge Risk', 'Medical Emergencies'],
    geofence: [
        { lat: 12.978, lng: 77.590 },
        { lat: 12.978, lng: 77.600 },
        { lat: 12.968, lng: 77.600 },
        { lat: 12.968, lng: 77.590 },
    ],
};

const MOCK_ASSETS = [
    { id: 'cam-1', type: 'Fixed Camera', label: 'Main Stage Cam', location: { lat: 12.975, lng: 77.595 } },
    { id: 'cam-2', type: '360° PTZ Camera', label: 'Entrance PTZ', location: { lat: 12.970, lng: 77.592 } },
    { id: 'barricade-1', type: 'Barricade', label: 'Queue Line', location: { lat: 12.971, lng: 77.592 } },
    { id: 'aid-1', type: 'First Aid Tent', label: 'Medical Tent 1', location: { lat: 12.976, lng: 77.598 } },
];

export function OperationsBriefing({ planId }: { planId: string }) {
    const [planData, setPlanData] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);

    useEffect(() => {
        // Fetch/load plan data and assets based on planId
        // Using mock data for demonstration
        setPlanData(MOCK_PLAN_DATA);
        setAssets(MOCK_ASSETS);
    }, [planId]);

    const handleExport = () => {
        // This would trigger a PDF generation service in a real app
        alert('Export to PDF functionality would be implemented here.');
    };

    if (!planData) return <div>Loading briefing...</div>;

    const surveillanceAssets = assets.filter(a => a.type.includes('Camera'));
    const accessControlAssets = assets.filter(a => a.type.includes('Barricade') || a.type.includes('Gate'));
    const medicalAssets = assets.filter(a => a.type.includes('Aid') || a.type.includes('Ambulance'));

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold">Operations Briefing</CardTitle>
                        <CardDescription>{planData.eventName}</CardDescription>
                    </div>
                    <Button onClick={handleExport}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Executive Summary */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Executive Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center"><Users className="mr-2 text-accent"/>Attendance</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{planData.peakAttendance.toLocaleString()}</p><p className="text-sm text-muted-foreground">Expected Peak</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base flex items-center"><AlertTriangle className="mr-2 text-accent"/>Primary Concerns</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm">
                                    {planData.securityConcerns.map((c:string) => <li key={c}>{c}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base flex items-center"><ShieldCheck className="mr-2 text-accent"/>VIP Presence</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{planData.vipPresence ? 'Yes' : 'No'}</p></CardContent>
                        </Card>
                    </div>
                </section>

                 {/* Tactical Map */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Tactical Operations Map</h2>
                    <div className="bg-muted rounded-md aspect-video flex items-center justify-center">
                        <p className="text-muted-foreground">Static map image with asset placements would be generated here.</p>
                         {/* In a real app, this would be a generated image of the map from the workspace */}
                    </div>
                </section>

                {/* Asset Manifest */}
                <section>
                     <h2 className="text-xl font-semibold mb-4 border-b pb-2">Asset & Personnel Manifest</h2>
                     {surveillanceAssets.length > 0 && <ManifestTable title="Surveillance Plan" assets={surveillanceAssets} />}
                     {accessControlAssets.length > 0 && <ManifestTable title="Access Control Plan" assets={accessControlAssets} />}
                     {medicalAssets.length > 0 && <ManifestTable title="Medical Response Plan" assets={medicalAssets} />}
                </section>

            </CardContent>
        </Card>
    );
}


const ManifestTable = ({ title, assets }: { title: string, assets: any[] }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Location</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assets.map(asset => (
                    <TableRow key={asset.id}>
                        <TableCell className="font-mono text-xs">{asset.id}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>{asset.label}</TableCell>
                        <TableCell>{`${asset.location.lat.toFixed(5)}, ${asset.location.lng.toFixed(5)}`}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);
