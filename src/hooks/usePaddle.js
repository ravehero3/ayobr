import { useEffect, useRef, useCallback } from 'react';

let paddleInitialized = false;
let cachedPriceId = null;
let initPromise = null;

async function initializePaddle(onCheckoutCompleted) {
  if (paddleInitialized) return true;
  if (typeof window.Paddle === 'undefined') return false;

  // Deduplicate concurrent init calls
  if (initPromise) return initPromise;

  initPromise = fetch('/api/paddle/config')
    .then(r => r.ok ? r.json() : null)
    .then(config => {
      if (!config?.clientToken) {
        initPromise = null;
        return false;
      }

      cachedPriceId = config.priceId;

      if (config.environment === 'sandbox') {
        window.Paddle.Environment.set('sandbox');
      }

      window.Paddle.Initialize({
        token: config.clientToken,
        eventCallback: (event) => {
          if (event.name === 'checkout.completed') {
            if (window.__paddleCheckoutCompleted) {
              window.__paddleCheckoutCompleted(event.data);
            }
          }
        }
      });

      paddleInitialized = true;
      initPromise = null;
      return true;
    })
    .catch(() => {
      initPromise = null;
      return false;
    });

  return initPromise;
}

export function usePaddle({ onCheckoutCompleted } = {}) {
  const callbackRef = useRef(onCheckoutCompleted);
  callbackRef.current = onCheckoutCompleted;

  // Register global callback so Paddle's eventCallback can reach it
  useEffect(() => {
    window.__paddleCheckoutCompleted = (data) => {
      if (callbackRef.current) callbackRef.current(data);
    };
    return () => { window.__paddleCheckoutCompleted = null; };
  }, []);

  // Eagerly initialize Paddle.js on mount
  useEffect(() => {
    initializePaddle(onCheckoutCompleted);
  }, []);

  const openCheckout = useCallback(async (userEmail) => {
    if (typeof window.Paddle === 'undefined') {
      console.warn('Paddle.js not loaded yet');
      return false;
    }

    const ready = await initializePaddle();
    if (!ready) {
      console.warn('Paddle not initialized — check PADDLE_CLIENT_TOKEN secret');
      return false;
    }

    const priceId = cachedPriceId;
    if (!priceId) {
      console.warn('No Paddle priceId configured — check PADDLE_PRO_PRICE_ID secret');
      return false;
    }

    try {
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
