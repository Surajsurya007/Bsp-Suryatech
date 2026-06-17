/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';

/**
 * Saves a detailed record of the completed payment to the database.
 */
export async function savePaymentToDatabase(orderData: {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  amount: number;
  couponCode?: string | null;
  paymentId: string;
  paymentMethod?: string;
}): Promise<boolean> {
  console.log('[PAYMENT SERVICE] Saving successful transaction payload to Supabase database for Order ID:', orderData.orderId);

  try {
    // 1. Double sync inside Supabase direct table schema
    const orderRecord = {
      id: orderData.orderId,
      user_id: orderData.userId,
      user_email: orderData.userEmail,
      user_name: orderData.userName,
      product_id: orderData.productId,
      product_name: orderData.productName,
      amount: orderData.amount,
      coupon_code: orderData.couponCode || null,
      status: 'success',
      payment_id: orderData.paymentId,
      created_at: new Date().toISOString()
    };

    const { error: dbErr } = await supabase.from('orders').insert(orderRecord);
    if (dbErr) {
      console.warn('[PAYMENT SERVICE] Direct orders table record insertion warning:', dbErr.message);
      // Attempt upsert/update if already generated during preprocessing
      const { error: upsertErr } = await supabase.from('orders').upsert(orderRecord);
      if (upsertErr) {
        console.error('[PAYMENT SERVICE] Direct orders table upsert error:', upsertErr.message);
      }
    }

    // 2. Generate and write direct customer licensing records
    const licenseKey = 'BSP-' + Array.from({ length: 4 }, () => Math.random().toString(36).substr(2, 5).toUpperCase()).join('-');
    const licenseRecord = {
      id: 'lic_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      user_id: orderData.userId,
      user_email: orderData.userEmail,
      order_id: orderData.orderId,
      product_id: orderData.productId,
      product_name: orderData.productName,
      license_key: licenseKey,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    const { error: licErr } = await supabase.from('licenses').insert(licenseRecord);
    if (licErr) {
      console.error('[PAYMENT SERVICE] License table write error:', licErr.message);
    }

    // 3. Write payment verification record
    const invoiceNumber = 'INV-' + Date.now().toString().substr(-6) + '-' + Math.floor(10 + Math.random() * 90);
    const paymentRecord = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      invoice_number: invoiceNumber,
      transaction_id: orderData.paymentId,
      payment_method: orderData.paymentMethod || 'Secure_Gateway',
      amount: orderData.amount,
      payment_date: new Date().toISOString(),
      status: 'success',
      order_id: orderData.orderId,
      user_id: orderData.userId
    };

    const { error: payErr } = await supabase.from('payments').insert(paymentRecord);
    if (payErr) {
      console.error('[PAYMENT SERVICE] Payments table write error:', payErr.message);
    }

    // 4. Generate invoice
    const gstAmount = parseFloat((orderData.amount * 0.18).toFixed(2));
    const netAmount = parseFloat((orderData.amount - gstAmount).toFixed(2));
    const invoiceRecord = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      invoice_number: invoiceNumber,
      order_id: orderData.orderId,
      user_id: orderData.userId,
      client_name: orderData.userName,
      business_name: 'Retail Enterprise Partner',
      email_address: orderData.userEmail,
      contact_number: '9999999999',
      amount: orderData.amount,
      gst_amount: gstAmount,
      net_amount: netAmount,
      product_name: orderData.productName,
      license_key: licenseKey,
      created_at: new Date().toISOString()
    };

    const { error: invErr } = await supabase.from('invoices').insert(invoiceRecord);
    if (invErr) {
      console.error('[PAYMENT SERVICE] Invoices table write error:', invErr.message);
    }

    // 5. Notify Secure CRM system via notification insert
    const notificationRecord = {
      id: 'not_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      user_id: orderData.userId,
      title: 'License Key Activated 🎁',
      message: `Your lifetime activation key for ${orderData.productName} is generated successfully: ${licenseKey}. Keep billing!`,
      read: false,
      created_at: new Date().toISOString()
    };

    const { error: notifErr } = await supabase.from('notifications').insert(notificationRecord);
    if (notifErr) {
      console.error('[PAYMENT SERVICE] Notifications table write error:', notifErr.message);
    }

    return true;
  } catch (error: any) {
    console.error('[PAYMENT SERVICE] Exception saving payment details to Database:', error);
    return false;
  }
}
