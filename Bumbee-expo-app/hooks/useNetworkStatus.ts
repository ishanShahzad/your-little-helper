import { useState, useEffect } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'slow';

interface NetworkState {
  isConnected: boolean;
  status: NetworkStatus;
  isSlow: boolean;
}

/**
 * Hook to monitor network connectivity status
 * Uses a simple ping approach to detect connectivity
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    status: 'online',
    isSlow: false,
  });

  useEffect(() => {
    let isMounted = true;
    let checkInterval: NodeJS.Timeout;

    async function checkConnection() {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (!isMounted) return;

        if (response.ok) {
          // Connection is working
          if (duration > 3000) {
            // Slow connection (>3s)
            setState({ isConnected: true, status: 'slow', isSlow: true });
          } else {
            // Good connection
            setState({ isConnected: true, status: 'online', isSlow: false });
          }
        } else {
          // Connection failed
          setState({ isConnected: false, status: 'offline', isSlow: false });
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        // Network error or timeout
        if (error.name === 'AbortError') {
          // Request timed out - slow or no connection
          setState({ isConnected: false, status: 'offline', isSlow: false });
        } else {
          // Other network error
          setState({ isConnected: false, status: 'offline', isSlow: false });
        }
      }
    }

    // Initial check
    checkConnection();

    // Check every 10 seconds
    checkInterval = setInterval(checkConnection, 10000);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
    };
  }, []);

  return state;
}
