import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import directus from '@/lib/directus';

interface WebSocketOptions {
  collections?: string[];
  showToast?: boolean;
  onMessage?: (message: any) => void;
}

export function useWebSocket({ collections = [], showToast = true, onMessage }: WebSocketOptions = {}) {
  const handleMessage = useCallback((message: any) => {
    if (showToast) {
      const collection = message.collection;
      const action = message.action;

      if (action === 'create') {
        toast.success(`New ${collection} created`);
      } else if (action === 'update') {
        toast.info(`${collection} updated`);
      } else if (action === 'delete') {
        toast.warning(`${collection} deleted`);
      }
    }

    // Call the custom message handler if provided
    onMessage?.(message);
  }, [showToast, onMessage]);

  useEffect(() => {
    // Set up WebSocket event listeners
    const openHandler = () => {
      console.log('WebSocket connection opened');
    };

    const closeHandler = () => {
      console.log('WebSocket connection closed');
      toast.error('Lost connection to server. Attempting to reconnect...');
    };

    const errorHandler = (error: any) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    };

    directus.onWebSocket('open', openHandler);
    directus.onWebSocket('close', closeHandler);
    directus.onWebSocket('error', errorHandler);
    directus.onWebSocket('message', handleMessage);

    // Set up subscriptions for each collection
    const subscriptions = collections.map(async (collection) => {
      const { subscription } = await directus.subscribe(collection, {
        event: '*', // Listen to all events (create, update, delete)
      });

      // Handle messages from subscription
      (async () => {
        try {
          for await (const item of subscription) {
            handleMessage(item);
          }
        } catch (error) {
          console.error(`Subscription error for ${collection}:`, error);
        }
      })();

      return subscription;
    });

    // Cleanup function
    return () => {
      directus.offWebSocket('open', openHandler);
      directus.offWebSocket('close', closeHandler);
      directus.offWebSocket('error', errorHandler);
      directus.offWebSocket('message', handleMessage);
      
      // Close all subscriptions
      subscriptions.forEach((subscriptionPromise) => {
        subscriptionPromise.then((subscription) => {
          subscription.return?.(); // Close the subscription if it's active
        });
      });
    };
  }, [collections, handleMessage]);
}