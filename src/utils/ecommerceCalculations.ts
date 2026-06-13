/**
 * BSP Suryatech - eCommerce Calculation Utilities for Indian GST & Custom Coupons 
 */

export interface TaxBreakdown {
  netAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalWithTax: number;
  gstRate: number;
}

export interface CouponDetails {
  code: string;
  discountPercent: number;
  active: boolean;
  expiresBy: string;
}

/**
 * Validates a coupon code against configured constraints.
 * Checks active status and expiry timestamps.
 */
export function validateCoupon(coupon: CouponDetails, cartSubtotal: number): { valid: boolean; discountAmount: number; finalSubtotal: number; error?: string } {
  const now = new Date();
  const expiryDate = new Date(coupon.expiresBy);

  if (!coupon.active) {
    return { valid: false, discountAmount: 0, finalSubtotal: cartSubtotal, error: 'Coupon code is inactive.' };
  }

  if (now > expiryDate) {
    return { valid: false, discountAmount: 0, finalSubtotal: cartSubtotal, error: 'Coupon code has expired.' };
  }

  const discountAmount = Math.round((cartSubtotal * coupon.discountPercent) / 100);
  const finalSubtotal = Math.max(0, cartSubtotal - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalSubtotal
  };
}

/**
 * Calculates Indian GST distribution.
 * 
 * In India:
 * - If billing state matches store origin state (e.g., Gujarat/Chhattisgarh):
 *   CGST (Central GST) = rate / 2
 *   SGST (State GST) = rate / 2
 *   IGST (Integrated GST) = 0
 * - If states differ:
 *   CGST = 0
 *   SGST = 0
 *   IGST = rate
 * 
 * Default GST rate for software downloads / licenses is 18%.
 */
export function calculateIndianGST(
  subtotal: number,
  customerState: string,
  originState: string = 'Chhattisgarh',
  gstRatePercent: number = 18
): TaxBreakdown {
  const isSameState = customerState.trim().toLowerCase() === originState.trim().toLowerCase();
  
  // Calculate reverse/forward tax (Indian Software solutions usually show tax-inclusive display prices)
  // Let's use tax-inclusive calculations where visible price = base + GST. Or tax-exclusive depending on setup.
  // We'll offer a clean tax-inclusive calculation to prevent changing displayed catalog pricing.
  const netAmount = Number((subtotal / (1 + gstRatePercent / 100)).toFixed(2));
  const gstAmount = Number((subtotal - netAmount).toFixed(2));

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isSameState) {
    cgstAmount = Number((gstAmount / 2).toFixed(2));
    sgstAmount = Number((gstAmount / 2).toFixed(2));
    igstAmount = 0;
  } else {
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = gstAmount;
  }

  return {
    netAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalWithTax: subtotal,
    gstRate: gstRatePercent
  };
}

/**
 * Calculates shipping charges.
 * Lightweight digital delivery is always free (₹0).
 * Physical deliverables (e.g. backup USB, paper manuals) incur safe threshold charges.
 */
export function calculateShipping(
  orderType: 'digital' | 'physical',
  cartSubtotal: number,
  shippingThreshold: number = 1500,
  flatShippingFee: number = 120
): number {
  if (orderType === 'digital') {
    return 0; // Instant digital activation delivery is always free
  }
  
  // If order total exceeds the threshold (e.g. ₹1500), physical parcel delivery is free
  return cartSubtotal >= shippingThreshold ? 0 : flatShippingFee;
}
