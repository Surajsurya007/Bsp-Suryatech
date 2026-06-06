/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dbActions, saveDB, db } from './db.ts';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazy initialization of Supabase Client to prevent crashes when env variables are not yet defined.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_KEY || '';

  if (!url || !key) {
    throw new Error('Supabase URL or API Key is missing. Please define SUPABASE_URL and SUPABASE_KEY in settings.');
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseInstance;
}

/**
 * Check if env credentials are fully configured.
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
}

/**
 * Pings Supabase to check for dynamic connectivity.
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return { 
      connected: false, 
      message: 'Supabase URL & API Key are not set in the environment variables (Secrets).',
      url: null 
    };
  }

  try {
    const client = getSupabaseClient();
    // Use an lightweight call to verify connectivity
    const { data, error } = await client
      .from('bsp_sync')
      .select('key')
      .limit(1)
      .maybeSingle();

    if (error) {
      // If error is code 42P01 (relation does not exist), they are connected but need table schema.
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          connected: true,
          message: 'Connected to Supabase! However, the "bsp_sync" table was not found. Please click "Initialize Table Schema" below to set it up.',
          needsSchema: true,
          url: process.env.SUPABASE_URL
        };
      }
      return { 
        connected: false, 
        message: `Supabase returned an API error (Code: ${error.code}): ${error.message}`,
        url: process.env.SUPABASE_URL 
      };
    }

    return { 
      connected: true, 
      message: 'Successfully connected and verified table schema in Supabase!',
      needsSchema: false,
      url: process.env.SUPABASE_URL 
    };
  } catch (err: any) {
    return { 
      connected: false, 
      message: `Failed to fetch from Supabase. Error: ${err.message || err}`,
      url: process.env.SUPABASE_URL 
    };
  }
}

/**
 * Create the 'bsp_sync' table if it does not exist.
 * Note: If using a standard user key, the user may need admin dashboard execution or RPC setup.
 * However, we can attempt an RPC or fallback to instructions.
 */
export async function pushDataToSupabase() {
  const client = getSupabaseClient();
  const collections = [
    { key: 'users', data: dbActions.getUsers() },
    { key: 'customerProfiles', data: dbActions.getCustomerProfiles() },
    { key: 'products', data: dbActions.getProducts() },
    { key: 'orders', data: dbActions.getOrders() },
    { key: 'licenses', data: dbActions.getLicenses() },
    { key: 'tickets', data: dbActions.getTickets() },
    { key: 'coupons', data: dbActions.getCoupons() },
    { key: 'testimonials', data: dbActions.getTestimonials() },
    { key: 'blogs', data: dbActions.getBlogs() },
    { key: 'reviews', data: dbActions.getReviews ? dbActions.getReviews() : [] },
    { key: 'payments', data: dbActions.getPayments ? dbActions.getPayments() : [] },
    { key: 'invoices', data: dbActions.getInvoices ? dbActions.getInvoices() : [] },
    { key: 'notifications', data: dbActions.getNotifications ? dbActions.getNotifications() : [] },
    { key: 'videoTutorials', data: dbActions.getVideoTutorials() }
  ];

  let successCount = 0;
  let failCount = 0;
  const details: string[] = [];

  for (const col of collections) {
    const { error } = await client
      .from('bsp_sync')
      .upsert({ key: col.key, data: col.data, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      failCount++;
      details.push(`Collection "${col.key}" failed: ${error.message}`);
    } else {
      successCount++;
    }
  }

  if (failCount > 0) {
    throw new Error(`Sync pushed ${successCount} collections, but ${failCount} failed. Details:\n${details.join('\n')}`);
  }

  return { success: true, pushedCount: successCount };
}

/**
 * Pull and merge or overwrite database with Supabase records.
 */
export async function pullDataFromSupabase(overwrite: boolean = true) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('bsp_sync')
    .select('key, data');

  if (error) {
    throw new Error(`Failed to pull records from Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { success: false, message: 'No backup records found in your Supabase "bsp_sync" table.' };
  }

  // Access the main db object from server/db.ts
  const liveDbModule = await import('./db.ts');
  const rawDb = (liveDbModule as any).db; // Get reference to in-memory db object inside db.ts

  if (!rawDb) {
    throw new Error('Local database storage state reference could not be resolved.');
  }

  let pulledCount = 0;
  for (const record of data) {
    const { key, data: recordsArray } = record;
    if (recordsArray && Array.isArray(recordsArray)) {
      if (overwrite) {
        rawDb[key] = recordsArray;
      } else {
        // Merge strategy (by id, if available)
        const currentArray = rawDb[key] || [];
        const mergedMap = new Map();
        currentArray.forEach((item: any) => {
          if (item && item.id) mergedMap.set(item.id, item);
        });
        recordsArray.forEach((item: any) => {
          if (item && item.id) mergedMap.set(item.id, item);
        });
        rawDb[key] = Array.from(mergedMap.values());
      }
      pulledCount++;
    }
  }

  saveDB(); // Write to local disk cache data/database.json

  return { 
    success: true, 
    pulledCount, 
    message: `Pulled and synced ${pulledCount} collections down from Supabase.` 
  };
}
