'use client';

import type { Alert } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IncidentIcon } from '../icons/incident-icons';
import { cn } from '@/lib/utils';
import { ClientOnlyTimestamp } from './client-only-timestamp';

interface AlertsFeedProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

const severityClasses = {
  High: 'border-red-500/50 hover:bg-red-500/10',
  Medium: 'border-yellow-500/50 hover:bg-yellow-500/10',
  Low: 'border-blue-500/50 hover:bg-blue-500/10',
};

const severityIconClasses = {
    High: 'text-red-500',
    Medium: 'text-yellow-500',
    Low: 'text-blue-500',
}

export default function AlertsFeed({ alerts, onAlertClick }: AlertsFeedProps) {
  return (
    <ScrollArea className="h-[calc(100%-1rem)]">
      <div className="space-y-3 pr-2">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            onClick={() => onAlertClick(alert)}
            className={cn(
                "cursor-pointer transition-colors",
                severityClasses[alert.severity]
            )}
          >
            <CardContent className="p-3 flex items-start space-x-3">
              <div className={cn("mt-1", severityIconClasses[alert.severity])}>
                <IncidentIcon type={alert.type} className="h-5 w-5" />
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-sm text-foreground">{alert.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
              <ClientOnlyTimestamp timestamp={alert.timestamp} />
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
