import { useEffect, useRef, useCallback } from 'react';

let paddleInitialized = false;

export function usePaddle({ onCheckoutCompleted } = {}) {
  const callbackRef = useRef(onCheckoutCompleted);
  callbackRef.current = onCheckoutCompleted;

  useEffect(() => {
    if (paddleInitialized) return;
    if (typeof window.Paddle === 'undefined') return;

    fetch('/api/paddle/config')
      .then(r => r.ok ? r.json() : null)
      .then(config => {
        if (!config?.clientToken) return;

        window.Paddle.Initialize({
          token: config.clientToken,
          eventCallback: (event) => {
            if (event.name === 'checkout.completed') {
              if (callbackRef.current) callbackRef.current(event.data);
            }
          }
        });

        if (config.environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        }

        paddleInitialized = true;
      })
      .catch(() => {});
  }, []);

  const openCheckout = useCallback(async (userEmail) => {
    if (typeof window.Paddle === 'undefined') {
      console.warn('Paddle.js not loaded yet');
      return false;
    }
    if (!paddleInitialized) {
      console.warn('Paddle not initialized — check PADDLE_CLIENT_TOKEN secret');
      return false;
    }

    try {
      const configRes = await fetch('/api/paddle/config');
      if (!configRes.ok) return false;
      const { priceId } = await configRes.json();
      if (!priceId) return false;

      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          locale: 'en',
          successUrl: window.location.origin + '/app?upgraded=true'
        }
      });
      return true;
    } catch (err) {
      console.error('Paddle checkout error:', err);
      return false;
    }
  }, []);

  return { openCheckout };
}
