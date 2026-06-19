/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TypeScript Interfaces for Razorpay Integration
 */
export interface RazorpayOrderResponse {
  id?: string;
  order_id?: string;
  amount: number; // in paise
  currency: string;
  key?: string;
  key_id?: string;
  [key: string]: any;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Dynamic script inclusion utility for checkout.js
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // If Razorpay instance already exists on the window object
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('[RAZORPAY SERVICE] checkout.js successfully loaded.');
      resolve(true);
    };
    script.onerror = () => {
      console.error('[RAZORPAY SERVICE] Failed to load checkout.js.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Invokes the client's existing Supabase edge function to create a new Razorpay order.
 * Ensures the Razorpay private secret key remains securely nested on the server side.
 */
export async function createRazorpayOrder(amountInPaise: number): Promise<RazorpayOrderResponse> {
  // 1. Try local server-side proxy route first (bypasses CORS "Failed to fetch" on browser)
  try {
    console.log(`[RAZORPAY SERVICE] Attempting to call local server proxy. Amount: ${amountInPaise} paise`);
    const proxyResponse = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountInPaise })
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const orderId = data.id || data.order_id;
      if (orderId) {
        console.log('[RAZORPAY SERVICE] Success via local server-side proxy:', data);
        return data;
      }
    }
    console.warn('[RAZORPAY SERVICE] Local proxy returned non-OK/invalid payload. Falling back to direct Edge function call...');
  } catch (proxyError: any) {
    console.warn('[RAZORPAY SERVICE] Local proxy call failed or was unreachable. Falling back to direct Supabase Edge Function... Error:', proxyError.message || proxyError);
  }

  // 2. Fallback to direct client-side fetch (with the identical headers and body)
  const url = 'https://wabhgsdzmptgxrggjjgm.supabase.co/functions/v1/smart-handler';

  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmhnc2R6bXB0Z3hyZ2dqamdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDQzMjIsImV4cCI6MjA5NjQ4MDMyMn0.g92rXSE_my0UyIUYuApjel6QyNP7CVrqBQoboNj6kDo',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmhnc2R6bXB0Z3hyZ2dqamdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDQzMjIsImV4cCI6MjA5NjQ4MDMyMn0.g92rXSE_my0UyIUYuApjel6QyNP7CVrqBQoboNj6kDo',
    'Content-Type': 'application/json'
  };

  console.log(`[RAZORPAY SERVICE] Fetching direct Edge function at: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      amount: amountInPaise
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`[RAZORPAY SERVICE] Direct Edge Function HTTP error: ${response.status}`, errBody);
    throw new Error(`Failed to initialize payment order: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  console.log('[RAZORPAY SERVICE] Received direct edge function order response:', responseData);

  // Validate properties
  const orderId = responseData.id || responseData.order_id;
  if (!orderId) {
    throw new Error('Supabase Edge Function response is invalid. No Razorpay order ID or ID was returned.');
  }

  return responseData;
}
