import { useEffect, useRef, useCallback } from 'react';

let paddleInitialized    = false;
let cachedPriceId        = null;
let cachedUnlimitedPriceId = null;
let initPromise          = null;

async function initializePaddle() {
  if (paddleInitialized) return true;
  if (typeof window.Paddle === 'undefined') return false;
  if (initPromise) return initPromise;

  initPromise = fetch('/api/paddle/config')
    .then(r => r.ok ? r.json() : null)
    .then(config => {
      if (!config?.clientToken) { initPromise = null; return false; }

      cachedPriceId          = config.priceId;
      cachedUnlimitedPriceId = config.unlimitedPriceId;

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
    .catch(() => { initPromise = null; return false; });

  return initPromise;
}

export function usePaddle({ onCheckoutCompleted } = {}) {
  const callbackRef = useRef(onCheckoutCompleted);
  callbackRef.current = onCheckoutCompleted;

  useEffect(() => {
    window.__paddleCheckoutCompleted = (data) => {
      if (callbackRef.current) callbackRef.current(data);
    };
    return () => { window.__paddleCheckoutCompleted = null; };
  }, []);

  useEffect(() => { initializePaddle(); }, []);

  /* plan: 'pro' | 'unlimited' */
  const openCheckout = useCallback(async (userEmail, plan = 'pro') => {
    if (typeof window.Paddle === 'undefined') {
      console.warn('Paddle.js not loaded yet');
      return false;
    }

    const ready = await initializePaddle();
    if (!ready) {
      console.warn('Paddle not initialized — check PADDLE_CLIENT_TOKEN secret');
      return false;
    }

    const priceId = plan === 'unlimited' ? cachedUnlimitedPriceId : cachedPriceId;
    if (!priceId) {
      console.warn(`No Paddle priceId configured for plan "${plan}"`);
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
