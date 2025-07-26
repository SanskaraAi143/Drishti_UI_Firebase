'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ClientOnlyTimestampProps {
    timestamp: Date;
}

export function ClientOnlyTimestamp({ timestamp }: ClientOnlyTimestampProps) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <p className="text-xs text-muted-foreground whitespace-nowrap">...</p>;
    }

    return (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
        </p>
    );
}
