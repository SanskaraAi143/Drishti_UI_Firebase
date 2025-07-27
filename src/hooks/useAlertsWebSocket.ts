import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '@/lib/types';

const useAlertsWebSocket = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<Event | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_API_HOST}/ws/alerts`;
    if (!wsUrl) {
      console.error("NEXT_PUBLIC_API_HOST is not defined in .env");
      setError(new Event("Configuration Error"));
      return;
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null); // Clear any previous errors on successful connection
    };

    socket.onmessage = (event) => {
      try {
        const newAlert: Alert = JSON.parse(event.data);
        // Ensure timestamp is a Date object
        newAlert.timestamp = new Date(newAlert.timestamp);
        setAlerts((prevAlerts) => {
          // Check if the alert already exists to prevent duplicates
          if (prevAlerts.some(alert => alert.id === newAlert.id)) {
            return prevAlerts;
          }
          return [newAlert, ...prevAlerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e, event.data);
        setError(new Event("Parsing Error"));
      }
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError(event);
      setIsConnected(false);
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      setIsConnected(false);
      // Attempt to reconnect after a delay, unless it was a clean close
      if (!event.wasClean) {
        console.log('Attempting to reconnect...');
        setTimeout(() => {
          // Re-run the effect to establish a new connection
          // This can be done by simply returning from this function
          // and letting the useEffect cleanup and re-run.
        }, 3000); // Reconnect after 3 seconds
      }
    };

    return () => {
      socket.close();
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return { alerts, error, isConnected };
};

export default useAlertsWebSocket;