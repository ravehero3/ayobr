import { useCallback } from 'react';

export function useLemonSqueezy() {
  const openCheckout = useCallback(async (userEmail, plan = 'pro', interval = 'yearly') => {
    try {
      const res = await fetch('/api/ls/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan, interval }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to initiate checkout.');
        return false;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return true;
      } else {
        alert('Failed to initiate checkout (missing checkout URL).');
        return false;
      }
    } catch (err) {
      console.error('Lemon Squeezy checkout error:', err);
      alert('Failed to connect to checkout server.');
      return false;
    }
  }, []);

  return { openCheckout };
}
