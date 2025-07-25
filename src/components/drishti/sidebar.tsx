'use client';

import type { Alert, Staff, MapLayers } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Users, Layers, BrainCircuit, Users2, ShieldAlert, Video, UserSearch } from 'lucide-react';
import AlertsFeed from './alerts-feed';
import StaffView from './staff-view';
import { DrishtiLogo } from '../icons/drishti-logo';
import { Sidebar as SidebarPrimitive, SidebarContent, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';

interface SidebarProps {
  alerts: Alert[];
  staff: Staff[];
  onAlertClick: (alert: Alert) => void;
  onStaffClick: (staff: Staff) => void;
  mapLayers: MapLayers;
  onToggleLayer: (layer: keyof MapLayers) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({
  alerts,
  staff,
  onAlertClick,
  onStaffClick,
  mapLayers,
  onToggleLayer,
  activeTab,
  setActiveTab
}: SidebarProps) {
  
  const handleTabChange = (value: string) => {
    // These tabs have their own views, others default to map
    if (['cameras', 'lost-and-found'].includes(value)) {
      setActiveTab(value);
    } else {
      setActiveTab('map');
    }
  }

  return (
    <SidebarPrimitive collapsible="icon" className="w-[380px] h-full flex flex-col bg-card border-r border-border p-4 space-y-4">
      <SidebarHeader>
        <div className="flex items-center space-x-3 px-2">
          <DrishtiLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold text-foreground">Drishti Commander</h1>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <Tabs defaultValue="alerts" className="flex-grow flex flex-col overflow-hidden" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts"><Bell className="mr-2 h-4 w-4"/>Alerts</TabsTrigger>
            <TabsTrigger value="staff"><Users className="mr-2 h-4 w-4"/>Staff</TabsTrigger>
            <TabsTrigger value="cameras"><Video className="mr-2 h-4 w-4"/>Cameras</TabsTrigger>
            <TabsTrigger value="lost-and-found"><UserSearch className="mr-2 h-4 w-4"/>Find</TabsTrigger>
          </TabsList>
          
          {/* Main content tabs */}
          <TabsContent value="alerts" className="flex-grow overflow-auto mt-4">
            <AlertsFeed alerts={alerts} onAlertClick={onAlertClick} />
          </TabsContent>
          <TabsContent value="staff" className="flex-grow overflow-auto mt-4">
            <StaffView staff={staff} onStaffClick={onStaffClick} />
          </TabsContent>
          {/* The content for 'cameras' and 'lost-and-found' are handled in commander-dashboard */}
          <TabsContent value="cameras" className="mt-4"/>
          <TabsContent value="lost-and-found" className="mt-4"/>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Layers className="mr-2 h-5 w-5"/>Map Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-toggle" className="flex items-center"><BrainCircuit className="mr-2 h-4 w-4 text-accent"/>Real-time Heatmap</Label>
              <Switch id="heatmap-toggle" checked={mapLayers.heatmap} onCheckedChange={() => onToggleLayer('heatmap')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-toggle" className="flex items-center"><Users2 className="mr-2 h-4 w-4 text-accent"/>Staff GPS</Label>
              <Switch id="staff-toggle" checked={mapLayers.staff} onCheckedChange={() => onToggleLayer('staff')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="incidents-toggle" className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-accent"/>Incident Flags</Label>
              <Switch id="incidents-toggle" checked={mapLayers.incidents} onCheckedChange={() => onToggleLayer('incidents')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bottlenecks-toggle" className="flex items-center"><Layers className="mr-2 h-4 w-4 text-accent"/>Predictive Bottlenecks</Label>
              <Switch id="bottlenecks-toggle" checked={mapLayers.bottlenecks} onCheckedChange={() => onToggleLayer('bottlenecks')} />
            </div>
          </CardContent>
        </Card>
      </SidebarContent>
    </SidebarPrimitive>
  );
}
