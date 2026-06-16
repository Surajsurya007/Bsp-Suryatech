/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Check, 
  X, 
  HelpCircle, 
  ShieldCheck, 
  Percent, 
  CreditCard, 
  Cpu, 
  IndianRupee, 
  Lock, 
  ArrowRight,
  Gift,
  AlertCircle,
  ShoppingCart,
  Trash2,
  Sparkles,
  Download
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  category: string;
  selectedPlanId: string;
  price?: number;
  originalPrice?: number;
  features?: string[];
  isSolution?: boolean;
  description?: string;
  icon?: string;
}

interface PricingProps {
  onPageChange: (page: string) => void;
  products: any[];
  user: any;
  onInitiateSimulatedCheckout: (productId: string, couponCode?: string) => void;
  cartItem: CartItem | null;
  setCartItem: (item: CartItem | null) => void;
}

export default function Pricing({ 
  onPageChange, 
  products, 
  user, 
  onInitiateSimulatedCheckout,
  cartItem,
  setCartItem
}: PricingProps) {
  const [coupon, setCoupon] = useState('');
  const [validatedDiscount, setValidatedDiscount] = useState<number | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponError, setCouponError] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);

  // Validate coupon code via server / Supabase
  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = coupon.trim().toUpperCase();
    if (!cleanCoupon) return;

    setValidationLoading(true);
    setCouponError('');
    console.log("Pricing: Validating coupon via Supabase direct query: ", cleanCoupon);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCoupon)
        .single();

      if (data && !error) {
        if (!data.active) {
          setCouponError('This coupon is no longer active');
          setValidatedDiscount(null);
          setAppliedCoupon('');
        } else if (data.expires_by && new Date(data.expires_by) < new Date()) {
          setCouponError('This coupon has expired');
          setValidatedDiscount(null);
          setAppliedCoupon('');
        } else {
          console.log("Pricing: Successfully validated coupon via Supabase:", data);
          setValidatedDiscount(data.discount_percent || data.discountPercent || 20);
          setAppliedCoupon(data.code);
          setCoupon('');
        }
      } else {
        if (error) {
          console.error("Pricing: Supabase coupon query failed:", error.message);
        }
        // Fallback or Try local codes validation
        const localCoupons = [
          { code: 'SURYA20', discountPercent: 20 },
          { code: 'INDIA50', discountPercent: 50 },
          { code: 'STARTUP10', discountPercent: 10 }
        ];
        const matched = localCoupons.find(c => c.code === cleanCoupon);
        if (matched) {
          console.log("Pricing: Coupon validated via local fallback system:", matched);
          setValidatedDiscount(matched.discountPercent);
          setAppliedCoupon(matched.code);
          setCoupon('');
        } else {
          setCouponError('Invalid coupon code');
          setValidatedDiscount(null);
          setAppliedCoupon('');
        }
      }
    } catch (err: any) {
      console.error("Pricing: Coupon validation exception:", err);
      setCouponError('Network error validating coupon code');
    } finally {
      setValidationLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setValidatedDiscount(null);
    setAppliedCoupon('');
    setCouponError('');
  };

  // Find real backend matching products based on connectedPlan or fallback id
  const dbProProduct = products?.find(p => p.connectedPlan === 'prod-billing-pro' || p.id === 'prod-billing-pro');
  const dbEnterpriseProduct = products?.find(p => p.connectedPlan === 'prod-billing-enterprise' || p.id === 'prod-billing-enterprise');

  const proPrice = dbProProduct !== undefined ? dbProProduct.price : 999;
  const proOriginal = dbProProduct !== undefined ? (dbProProduct.originalPrice || 2499) : 2499;

  const entPrice = dbEnterpriseProduct !== undefined ? dbEnterpriseProduct.price : 2999;
  const entOriginal = dbEnterpriseProduct !== undefined ? (dbEnterpriseProduct.originalPrice || 4999) : 4999;

  const currentPlanId = cartItem?.selectedPlanId || 'prod-billing-pro';
  
  // Custom solution fallback
  const rawPrice = cartItem?.isSolution && cartItem?.price !== undefined
    ? cartItem.price
    : (currentPlanId === 'prod-billing-enterprise' ? entPrice : proPrice);

  const rawOriginalPrice = cartItem?.isSolution && cartItem?.originalPrice !== undefined
    ? cartItem.originalPrice
    : (currentPlanId === 'prod-billing-enterprise' ? entOriginal : proOriginal);

  // Coupon discount computation
  const discountPercent = validatedDiscount || 0;
  const discountAmount = Math.ceil(rawPrice * (discountPercent / 100));
  const netAmount = rawPrice - discountAmount;
  
  // Tax breakdown (18% inclusive GST calculation)
  const gstInclusiveAmount = Math.ceil(netAmount * 0.18);
  const basePriceExclusive = netAmount - gstInclusiveAmount;

  const handleAddToCart = (planId: string) => {
    const foundProduct = products?.find(p => p.id === planId);
    const resolvedName = foundProduct?.name || (planId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro');
    setCartItem({
      id: planId,
      name: resolvedName,
      category: 'Billing & POS Software',
      selectedPlanId: planId,
      isSolution: false
    });
  };

  const handleRemoveFromCart = () => {
    setCartItem(null);
    handleClearCoupon();
  };

  const handleBuyClickInCart = () => {
    if (!cartItem) return;
    if (!user) {
      // Must login/register first to track active keys!
      onPageChange('portal');
    } else {
      onInitiateSimulatedCheckout(cartItem.selectedPlanId, appliedCoupon || undefined);
    }
  };

  return (
    <div className="py-12 space-y-16 pb-24 text-slate-800" id="pricing-page-root">
      
      {/* HEADER CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">Pricing Packages</h1>
        <p className="text-4xl font-black tracking-tight text-white leading-none">
          Choose Your Lifetime License
        </p>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Add the BSP Suryatech software solution to your cart to customize your price plan, unlock discounts, and download the registered offline desktop platform.
        </p>
      </section>

      {/* DYNAMIC CART MAIN WORKSPACE */}
      <section className="max-w-4xl mx-auto px-4">
        {!cartItem ? (
          /* CART IS EMPTY STATE - PROMPTS ADD SOFTWARE */
          <div className="bg-[#1E293B] border border-slate-850 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden" id="empty-cart-view">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            
            <div className="mx-auto w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-slate-750 text-slate-400">
              <ShoppingCart className="w-8 h-8 text-[#2563EB]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Your Shopping Cart is Empty</h2>
              <p className="text-slate-450 text-xs sm:text-sm max-w-lg mx-auto">
                Please add the BSP Suryatech software solution to your cart to customize your price plan, unlock discounts, and download the registered offline desktop platform.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => onPageChange('downloads')}
                className="px-8 py-4 bg-[#2563EB] hover:bg-blue-750 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                id="add-software-to-cart-btn"
              >
                <Download className="w-4 h-4" />
                <span>Go to Download Center</span>
              </button>
            </div>
          </div>
        ) : (
          /* CART CONTAINS SOFTWARE - CHOOSE PRICE PLAN ACTIVE STAGE */
          <div className="bg-[#1E293B] border border-blue-500/20 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-10" id="active-cart-view bg-zinc-950">
            {/* Header of Active Cart */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center text-[#2563EB]">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">✓ Cart Active (1 Item)</span>
                  <h2 className="text-xl font-black text-white">{cartItem.name}</h2>
                </div>
              </div>

              <button
                onClick={handleRemoveFromCart}
                className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-red-400 font-extrabold cursor-pointer self-start sm:self-center transition-colors px-2.5 py-1 bg-slate-900/60 rounded border border-slate-800 hover:bg-red-950/20 hover:border-red-900/40"
                id="clear-cart-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Cart</span>
              </button>
            </div>

            {/* GRID SELECTION OF PRICE PLAN */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">
                {cartItem?.isSolution ? 'Your Selected Custom Business Solution' : 'Step 1: Choose Your License Price Plan'}
              </h3>
              
              {cartItem?.isSolution ? (
                <div className="bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden" id="custom-selected-solution-card">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/85 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-blue-500/10 p-2.5 rounded-2xl block text-[#2563EB]">
                        {cartItem.icon || '🛍️'}
                      </span>
                      <div>
                        <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/35 text-blue-400 text-[10px] rounded font-mono font-bold uppercase tracking-wider">
                          Custom Solution
                        </span>
                        <h4 className="font-extrabold text-lg text-white mt-0.5">{cartItem.name}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-1.5 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start sm:self-center">
                      <span className="text-[11px] font-mono text-slate-400">Price:</span>
                      <span className="text-xl font-black text-white">₹{rawPrice}</span>
                      <span className="text-[10px] text-slate-500 line-through">₹{rawOriginalPrice}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cartItem.description && (
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {cartItem.description}
                      </p>
                    )}
                    
                    {cartItem.features && cartItem.features.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">INCLUDED FEATURES:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cartItem.features.map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-350">
                              <span className="w-4 h-4 bg-emerald-950/40 text-emerald-400 font-bold font-mono rounded-full flex items-center justify-center text-[10px] border border-emerald-900/30">✓</span>
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-800/60">
                    <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
                      This industry-specific application has database setups and layout designers dedicated to your business.
                    </p>
                    <button
                      onClick={() => {
                        // Switch back to standard Retail Billing Pro
                        handleAddToCart('prod-billing-pro');
                      }}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-755"
                      id="use-standard-editions-btn"
                    >
                      Use Standard Editions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PLAN A: Pro */}
                  <div
                    onClick={() => cartItem && setCartItem({ 
                      ...cartItem, 
                      selectedPlanId: 'prod-billing-pro',
                      name: dbProProduct?.name || 'BSP Suryatech Retail Billing Pro' 
                    })}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      currentPlanId === 'prod-billing-pro'
                        ? 'border-blue-500 bg-slate-900 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                    id="cart-choose-pro"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/35 text-blue-400 text-[9px] rounded font-mono font-bold">
                          PRO PLAN
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentPlanId === 'prod-billing-pro' ? 'border-blue-500' : 'border-slate-600'}`}>
                          {currentPlanId === 'prod-billing-pro' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-extrabold text-base text-white">Retail Billing Pro Edition</h4>
                        <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                          Lightweight single-terminal POS invoice operations. Includes stock minimum alerts, thermal customizing layouts, and full local ledgers.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-baseline gap-1.5">
                      <span className="text-xs font-mono text-slate-500">Price:</span>
                      <span className="text-2xl font-black text-white">₹{proPrice}</span>
                      <span className="text-xs text-slate-500 line-through">₹{proOriginal}</span>
                      <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold font-mono ml-auto">SAVE 60%</span>
                    </div>
                  </div>

                  {/* PLAN B: Enterprise */}
                  <div
                    onClick={() => cartItem && setCartItem({ 
                      ...cartItem, 
                      selectedPlanId: 'prod-billing-enterprise',
                      name: dbEnterpriseProduct?.name || 'BSP Suryatech GST Enterprise Suite'
                    })}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      currentPlanId === 'prod-billing-enterprise'
                        ? 'border-blue-500 bg-slate-900 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                    id="cart-choose-enterprise"
                  >
                    {currentPlanId === 'prod-billing-enterprise' && (
                      <span className="absolute -top-2.5 right-6 px-2.5 py-0.5 bg-[#10B981] text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                        BEST VALUE
                      </span>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[9px] rounded font-mono font-bold">
                          MULTIFIRM SUITE
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentPlanId === 'prod-billing-enterprise' ? 'border-blue-500' : 'border-slate-600'}`}>
                          {currentPlanId === 'prod-billing-enterprise' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-base text-white">GST Enterprise Suite</h4>
                        <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                          Direct GST Portal JSON monthly exports (GSTR-1, GSTR-3B), unlimited firms/branch records, Google Drive automatic cloud backups, and priority hotline calls support.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-baseline gap-1.5">
                      <span className="text-xs font-mono text-slate-500">Price:</span>
                      <span className="text-2xl font-black text-white">₹{entPrice}</span>
                      <span className="text-xs text-slate-500 line-through">₹{entOriginal}</span>
                      <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold font-mono ml-auto">SAVE 40%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COUPON INPUT AND TALLY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-slate-800 pt-8">
              
              {/* Left Column: Coupon Input */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block">
                  Promotional Coupon
                </span>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-4 text-center">
                  <div className="flex justify-center text-blue-500">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-white">Have a discount coupon?</h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Enter codes like <strong className="text-blue-400">INDIA50</strong> (50% Off) or <strong className="text-blue-400">SURYA20</strong> (20% Off).
                    </p>
                  </div>

                  {appliedCoupon ? (
                    <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-extrabold font-mono text-emerald-400">{appliedCoupon} (-{discountPercent}%)</span>
                      <button
                        onClick={handleClearCoupon}
                        className="text-[11px] text-red-400 hover:text-red-300 font-extrabold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleValidateCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="PROMO CODE"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="flex-grow bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-center font-bold text-xs text-white uppercase tracking-wider focus:border-blue-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={validationLoading}
                        className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                      >
                        {validationLoading ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-[10px] text-red-400 font-sans">{couponError}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Pricing Breakdown & Checkout Action */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block">
                  Detailed Billing Summary
                </span>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Selected Plan Original Price:</span>
                    <span className="line-through text-slate-500">₹{rawOriginalPrice}</span>
                  </div>
                  
                  <div className="flex justify-between text-slate-300">
                    <span>Software Base Price:</span>
                    <span>₹{rawPrice}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 bg-emerald-950/20 px-2 py-1.5 rounded">
                      <span>Promo Coupon Discount ({appliedCoupon}):</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-450 border-t border-slate-800/80 pt-2.5">
                    <span>Tax Exclusive Net Value:</span>
                    <span>₹{basePriceExclusive}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>18% Inclusive CGST + SGST Rate:</span>
                    <span>₹{gstInclusiveAmount}</span>
                  </div>

                  <div className="flex justify-between text-white text-base font-black border-t-2 border-dashed border-slate-850 pt-3 font-sans">
                    <span className="text-slate-300">Total Price (Payable):</span>
                    <div className="text-right">
                      <span className="text-2xl text-blue-400">₹{netAmount}</span>
                      <span className="block text-[9px] text-slate-450 font-normal mt-0.5 tracking-tight font-mono">
                        // ONE-TIME ONLY PAYMENT, NO RENEWALS
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBuyClickInCart}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  id="checkout-proceed-cart-btn"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Proceed to Simulated Razorpay Secure Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                {!user && (
                  <span className="text-[10px] text-center text-yellow-450 block font-medium">
                    ⚠️ Note: You will be redirected to complete Client Portal Registration/Login first. Your Cart details will persist automatically!
                  </span>
                )}
              </div>

            </div>

          </div>
        )}
      </section>

      {/* PLANS COMPARE MATRIX BULLETS MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">Features Grid</span>
          <h3 className="text-2xl font-black text-white">Compare Editions</h3>
          <p className="text-slate-450 text-xs">Review standard feature differences mapped between Pro and Enterprise licenses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Pro Column Bullet List comparison */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/35 text-blue-400 text-[9px] rounded font-mono font-bold uppercase">
              Retail Billing Pro
            </span>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-2"><Check className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" /> <span>UNLIMITED invoice generations & cashier lanes printing</span></li>
              <li className="flex gap-2"><Check className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" /> <span>Thermal printer canvas size customizer (58mm / 80mm roll setups)</span></li>
              <li className="flex gap-2"><Check className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" /> <span>Dynamic high speed PDF outputs formats generator</span></li>
              <li className="flex gap-2"><Check className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" /> <span>Barcode automated printing & fast hardware scanning support</span></li>
              <li className="flex gap-2"><Check className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" /> <span>Supplier credit ledgers, dynamic cashbook registers balances</span></li>
              <li className="flex gap-2 text-slate-500 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> <span>Multi-firm ledger management (Single trading company file only)</span></li>
              <li className="flex gap-2 text-slate-500 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> <span>Direct government GST portal portal JSON uploads GSTR-1 formatted</span></li>
            </ul>
          </div>

          {/* Enterprise Column Bullet List comparison */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[9px] rounded font-mono font-bold uppercase">
              GST Enterprise Suite
            </span>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span><strong>EVERY FEATURE</strong> included in the standard Retail Billing Pro</span></li>
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span>Unlimited physical firms, multiple branch databases records</span></li>
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span>Direct government GST format exporting files (JSON, CSV, XLS)</span></li>
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span>Auto-scheduled drive data cloud synchronization backup schedules</span></li>
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span>Highly detailed permissions roles management (Cashier vs Admin)</span></li>
              <li className="flex gap-2"><Check className="text-emerald-400 w-4 h-4 shrink-0 mt-0.5" /> <span>Priority premium technical telephonic support & setup help desk</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* CORE SECURE FEATURES ACCREDIT */}
      <section className="bg-slate-900/60 py-12 border-y border-slate-850 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="space-y-2.5 p-4" id="assurance-billing-safety">
            <div className="w-10 h-10 bg-slate-850 rounded-lg flex items-center justify-center border border-slate-800 shadow-sm mx-auto md:mx-0 text-emerald-450">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-[#F8FAFC] text-base leading-snug">Instant Automated Verification</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Once you complete the simulation deposit, our licensing backend automatically allocates serial credentials within 3 seconds visible inside your dashboard.</p>
          </div>

          <div className="space-y-2.5 p-4" id="assurance-payment-modes">
            <div className="w-10 h-10 bg-slate-850 rounded-lg flex items-center justify-center border border-slate-800 shadow-sm mx-auto md:mx-0 text-blue-450">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-[#F8FAFC] text-base leading-snug">All Indian Payment Methods</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Accepting standard Credit/Debit Cards, UPI scanner, PhonePe, Google Pay, NetBanking and major wallets supported by secure sandbox credentials.</p>
          </div>

          <div className="space-y-2.5 p-4" id="assurance-unlimited-terms">
            <div className="w-10 h-10 bg-slate-850 rounded-lg flex items-center justify-center border border-slate-800 shadow-sm mx-auto md:mx-0 text-[#10B981]">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-[#F8FAFC] text-base leading-snug">30-Day Money-Back Guarantee</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Try Suryatech completely risk free. If it does not connect to your barcode scanner or prints paper tickets incorrectly, raise a support ticket for full license refunds.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
