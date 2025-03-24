import { useEffect } from 'react';
import directus from '@/lib/directus';
import { toast } from 'sonner';

type SubscriptionOptions = {
  collection: string;
  showToast?: boolean;
  toastMessage?: string;
  query?: Record<string, any>;
  event?: 'create' | 'update' | 'delete';
  onEvent?: (item: any) => void;
};

export function useDirectusSubscription({
  collection,
  showToast = false,
  toastMessage,
  query = {},
  event = 'create',
  onEvent,
}: SubscriptionOptions) {
  useEffect(() => {
    let isMounted = true;

    // WebSocket event listeners
    directus.onWebSocket('open', function () {
      console.log(`WebSocket connection opened for ${collection}`);
    });

    directus.onWebSocket('message', function (message) {
      if (showToast) {
        toast(toastMessage || `${collection} has been ${event}d`);
      }
      console.log('New message of type ' + message.type, message.data);
    });

    directus.onWebSocket('close', function () {
      console.log(`WebSocket connection closed for ${collection}`);
    });

    directus.onWebSocket('error', function (error) {
      console.error('WebSocket error:', error);
      toast.error(`Error in ${collection} connection`);
    });

    // Subscribe to collection changes
    const setupSubscription = async () => {
      try {
        const { subscription } = await directus.subscribe(collection, {
          event,
          query: { fields: query.fields || ['*'] },
        });

        // Listen for events
        (async () => {
          for await (const item of subscription) {
            if (!isMounted) break;
            console.log(`${collection} ${event}:`, item);
            if (onEvent) onEvent(item);
          }
        })();
      } catch (error) {
        console.error(`Error setting up ${collection} subscription:`, error);
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [collection, showToast, toastMessage, query, event, onEvent]);
}