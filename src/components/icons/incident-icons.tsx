import { Users, Ambulance, ShieldAlert, Package, type LucideProps, AlertTriangle } from 'lucide-react';
import type { Alert } from '@/lib/types';

export function IncidentIcon({ type, ...props }: { type: Alert['type'] } & LucideProps) {
  switch (type) {
    case 'CrowdSurge':
      return <Users {...props} />;
    case 'Altercation':
      return <ShieldAlert {...props} />;
    case 'Medical':
      return <Ambulance {...props} />;
    case 'UnattendedObject':
      return <Package {...props} />;
    default:
      return <AlertTriangle {...props} />;
  }
}
