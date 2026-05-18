import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

let paddleInitialized    = false;
let cachedProMonthlyId = null;
let cachedProYearlyId = null;
let cachedUnlimitedMonthlyId = null;
let cachedUnlimitedYearlyId = null;
let initPromise          = null;

async function initializePaddle() {
  if (paddleInitialized) return true;
  if (typeof window.Paddle === 'undefined') return false;
  if (initPromise) return initPromise;

  initPromise = fetch('/api/paddle/config')
    .then(r => r.ok ? r.json() : null)
    .then(config => {
      if (!config?.clientToken) { initPromise = null; return false; }

      cachedProMonthlyId       = config.proMonthlyPriceId;
      cachedProYearlyId        = config.proYearlyPriceId;
      cachedUnlimitedMonthlyId = config.unlimitedMonthlyPriceId;
      cachedUnlimitedYearlyId  = config.unlimitedYearlyPriceId;

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
  const { language } = useLanguage();
  const callbackRef = useRef(onCheckoutCompleted);
  callbackRef.current = onCheckoutCompleted;

  useEffect(() => {
    window.__paddleCheckoutCompleted = (data) => {
      if (callbackRef.current) callbackRef.current(data);
    };
    return () => { window.__paddleCheckoutCompleted = null; };
  }, []);

  useEffect(() => { initializePaddle(); }, []);

  /* plan: 'pro' | 'unlimited', interval: 'monthly' | 'yearly' */
  const openCheckout = useCallback(async (userEmail, plan = 'pro', interval = 'yearly') => {
    if (language === 'cs') {
      try {
        const res = await fetch('/api/gopay/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, isAnnual: interval === 'yearly' }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Failed to initiate GoPay checkout.');
          return false;
        }
        const { gwUrl } = await res.json();
        if (gwUrl) {
          window.location.href = gwUrl;
          return true;
        } else {
          alert('Failed to initiate GoPay checkout (missing gwUrl).');
          return false;
        }
      } catch (err) {
        console.error('GoPay checkout error:', err);
        alert('Failed to connect to GoPay payment gateway.');
        return false;
      }
    }

    if (typeof window.Paddle === 'undefined') {
      console.warn('Paddle.js not loaded yet');
      return false;
    }

    const ready = await initializePaddle();
    if (!ready) {
      console.warn('Paddle not initialized — check PADDLE_CLIENT_TOKEN secret');
      return false;
    }

    let priceId = null;
    if (plan === 'unlimited') {
      priceId = interval === 'yearly' ? cachedUnlimitedYearlyId : cachedUnlimitedMonthlyId;
    } else {
      priceId = interval === 'yearly' ? cachedProYearlyId : cachedProMonthlyId;
    }

    if (!priceId) {
      console.warn(`No Paddle priceId configured for plan "${plan}" and interval "${interval}"`);
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
  }, [language]);

  return { openCheckout };
}
