'use client';

import type { Staff } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, UserCheck, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffViewProps {
  staff: Staff[];
  onStaffClick: (staff: Staff) => void;
}

const statusIcons = {
    Patrolling: <UserCheck className="h-4 w-4 text-green-400" />,
    Responding: <UserX className="h-4 w-4 text-red-400" />,
    'On-Break': <Clock className="h-4 w-4 text-yellow-400" />,
}

export default function StaffView({ staff, onStaffClick }: StaffViewProps) {
  return (
    <ScrollArea className="h-[calc(100%-1rem)]">
      <div className="space-y-3 pr-2">
        {staff.map((s) => (
          <Card key={s.id} className="transition-colors hover:bg-muted/50">
            <CardContent className="p-3 flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={s.avatar} alt={s.name} data-ai-hint="person portrait" />
                <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-semibold text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.role}</p>
                 <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {statusIcons[s.status]}
                    <span className="ml-1.5">{s.status}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onStaffClick(s)}>
                <MapPin className="mr-2 h-4 w-4" />
                Locate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
