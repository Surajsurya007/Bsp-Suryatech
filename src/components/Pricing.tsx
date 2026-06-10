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
  AlertCircle
} from 'lucide-react';

interface PricingProps {
  onPageChange: (page: string) => void;
  products: any[];
  user: any;
  onInitiateSimulatedCheckout: (productId: string, couponCode?: string) => void;
}

export default function Pricing({ onPageChange, products, user, onInitiateSimulatedCheckout }: PricingProps) {
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
          setValidatedDiscount(data.discount_percent || data.discountPercent);
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

  const getPriceBeforeAndAfter = (originalPrice: number) => {
    if (!validatedDiscount) return { price: originalPrice, discounted: false };
    const finalAmount = Math.ceil(originalPrice * (1 - validatedDiscount / 100));
    return { price: finalAmount, discounted: true, original: originalPrice };
  };

  // Find real backend matching products based on connectedPlan or fallback id
  const dbProProduct = products?.find(p => p.connectedPlan === 'prod-billing-pro' || p.id === 'prod-billing-pro');
  const dbEnterpriseProduct = products?.find(p => p.connectedPlan === 'prod-billing-enterprise' || p.id === 'prod-billing-enterprise');

  const plansList = [
    {
      id: 'plan-free-trial',
      name: 'Free Trial Edition',
      price: 0,
      period: '15 Days Evaluation',
      badge: 'Evaluation Only',
      ctaText: 'Instantly Download EXE',
      action: () => onPageChange('downloads'),
      bullets: [
        { active: true, txt: 'Up to 100 invoice trial prints' },
        { active: true, txt: 'Thermal and Laser receipt templates' },
        { active: true, txt: 'Full stock inventory ledger features' },
        { active: false, txt: 'GSTR monthly JSON exporting' },
        { active: false, txt: 'Multi-firm/Multi-branch files' },
        { active: false, txt: 'Telephone hotline tech support' }
      ]
    },
    {
      id: 'prod-billing-pro',
      name: dbProProduct?.name || 'Retail Billing Pro',
      price: dbProProduct !== undefined ? dbProProduct.price : 1999,
      originalPrice: dbProProduct !== undefined ? (dbProProduct.originalPrice || 2499) : 2499,
      period: 'One-time Payment (Lifetime)',
      badge: dbProProduct?.version ? `Best Seller • ${dbProProduct.version}` : 'Best Seller • 60% Off',
      isPopular: true,
      ctaText: 'Buy Lifetime License Now',
      action: () => handleBuyClick(dbProProduct?.id || 'prod-billing-pro'),
      bullets: dbProProduct?.features && dbProProduct.features.length > 0 
        ? dbProProduct.features.map((f: string) => ({ active: true, txt: f }))
        : [
            { active: true, txt: 'UNLIMITED invoices & thermal prints' },
            { active: true, txt: 'Interactive thermal print layout customizer' },
            { active: true, txt: 'Barcode scanning & dynamic labels creator' },
            { active: true, txt: 'Complete supplier credit ledger ledger' },
            { active: true, txt: 'Monthly profit & loss spreadsheets' },
            { active: false, txt: 'Multi-firm support (Single branch only)' }
          ]
    },
    {
      id: 'prod-billing-enterprise',
      name: dbEnterpriseProduct?.name || 'GST Enterprise Suite',
      price: dbEnterpriseProduct !== undefined ? dbEnterpriseProduct.price : 2999,
      originalPrice: dbEnterpriseProduct !== undefined ? (dbEnterpriseProduct.originalPrice || 4999) : 4999,
      period: 'One-time Payment (Lifetime)',
      badge: dbEnterpriseProduct?.version ? `Multi-Firm • ${dbEnterpriseProduct.version}` : 'Multi-Firm • Complete Tech Support',
      ctaText: 'Buy Enterprise License Now',
      action: () => handleBuyClick(dbEnterpriseProduct?.id || 'prod-billing-enterprise'),
      isPopular: false,
      bullets: dbEnterpriseProduct?.features && dbEnterpriseProduct.features.length > 0
        ? dbEnterpriseProduct.features.map((f: string) => ({ active: true, txt: f }))
        : [
            { active: true, txt: 'All features of Retail Billing Pro' },
            { active: true, txt: 'Unlimited Firms & Branch accounts' },
            { active: true, txt: 'Direct GSTR-1 & GSTR-3B JSON exports' },
            { active: true, txt: 'Google Drive auto cloud data backups' },
            { active: true, txt: 'Custom receipt canvas layout designer' },
            { active: true, txt: 'Priority phone call installation assistance' }
          ]
    }
  ];

  const handleBuyClick = (productId: string) => {
    if (!user) {
      // Must login/register first to track active keys!
      onPageChange('portal');
    } else {
      onInitiateSimulatedCheckout(productId, appliedCoupon || undefined);
    }
  };

  return (
    <div className="py-16 space-y-20 pb-24">
      {/* HEADER CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">Pricing Packages</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          One-Time License. Zero Subscription Fee.
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          Pay once, download active installer, and register forever. Save thousands annually compared to expensive recurring cloud subscription tools. No hidden catch!
        </p>
      </section>

      {/* DYNAMIC COUPON REDUAL BLOCK */}
      <section className="max-w-md mx-auto px-4">
        <div className="bg-slate-100 border border-slate-200 p-5 rounded-2xl shadow-sm text-center space-y-3.5">
          <div className="flex justify-center text-blue-600">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-800">Have a Promotional Coupon?</span>
            <p className="text-xs text-slate-500 leading-normal">Enter codes like <strong className="text-blue-600">INDIA50</strong> (50% Off) or <strong className="text-blue-600">SURYA20</strong> (20% Off) to apply instant discounts.</p>
          </div>

          {appliedCoupon ? (
            <div className="bg-emerald-950 border border-emerald-800 p-3.5 rounded-xl flex items-center justify-between text-emerald-200">
              <div className="flex items-center gap-2 text-xs">
                <Percent className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Coupon <strong>{appliedCoupon}</strong> active (<strong>-{validatedDiscount}% Off</strong>)</span>
              </div>
              <button 
                onClick={handleClearCoupon} 
                className="text-xs text-emerald-400 hover:text-white font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>
          ) : (
            <form onSubmit={handleValidateCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="PROMO CODE"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-grow bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-center font-bold text-sm text-slate-800 uppercase tracking-widest"
                id="pricing-coupon-input"
              />
              <button
                type="submit"
                disabled={validationLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {validationLoading ? '...' : 'Apply'}
              </button>
            </form>
          )}
          
          {couponError && (
            <div className="text-xs text-red-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{couponError}</span>
            </div>
          )}
        </div>
      </section>

      {/* PLANS CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plansList.map((plan) => {
            const isMockFree = plan.price === 0;
            const priceInfo = getPriceBeforeAndAfter(plan.price);
            
            return (
              <div 
                key={plan.id}
                className={`bg-white border rounded-3xl p-8 relative flex flex-col justify-between ${
                  plan.isPopular 
                    ? 'border-blue-500 shadow-xl shadow-blue-50/70 border-2' 
                    : 'border-slate-200 shadow-sm hover:border-slate-350'
                }`}
                id={`price-plan-card-${plan.id}`}
              >
                {/* Popular Pill badge */}
                {plan.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow">
                    Most Popular Choice
                  </span>
                )}

                <div className="space-y-6">
                  {/* Top Header Card info */}
                  <div>
                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9.5px] font-mono uppercase tracking-wider font-bold">
                      {plan.badge || 'Lifetime Access'}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-3">{plan.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-normal">Fully working desktop license.</p>
                  </div>

                  {/* Pricing segment */}
                  <div className="py-4 border-y border-slate-100">
                    {isMockFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-800">FREE</span>
                        <span className="text-slate-500 text-sm font-medium">/{plan.period}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {priceInfo.discounted && (
                          <div className="text-xs text-slate-400 line-through">
                            ₹{plan.originalPrice || plan.price}
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-slate-500 font-mono">INR</span>
                          <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
                            ₹{priceInfo.price}
                          </span>
                          <span className="text-xs text-slate-500 font-bold block ml-1 uppercase">One-Time Only</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">No monthly billing. GST included.</span>
                      </div>
                    )}
                  </div>

                  {/* Plan core bullets features */}
                  <ul className="space-y-3.5">
                    {plan.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex gap-2.5 text-sm" id={`plan-bullet-${plan.id}-${bIdx}`}>
                        {b.active ? (
                          <Check className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4.5 h-4.5 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span className={b.active ? 'text-slate-700 leading-snug' : 'text-slate-400 line-through leading-snug'}>
                          {b.txt}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary CTA Buy button action */}
                <div className="pt-8">
                  <button
                    onClick={plan.action}
                    className={`w-full py-4 rounded-xl font-black text-sm tracking-wide shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-400/20 shadow-lg'
                        : 'bg-slate-900 hover:bg-slate-850 text-white'
                    }`}
                    id={`price-cta-buy-${plan.id}`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {!isMockFree && !user && (
                    <span className="text-[9.5px] text-center text-slate-400 block mt-2">Requires Customer Portal login for instant code activations.</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* CORE SECURE FEATURES ACCREDIT */}
      <section className="bg-slate-100 py-16 border-y border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="space-y-2.5 p-4" id="assurance-billing-safety">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm mx-auto md:mx-0">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base leading-snug">Instant Automated Verification</h4>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Once you complete the simulation deposit, our licensing backend automatically allocates serial credentials within 3 seconds visible inside your dashboard.</p>
          </div>

          <div className="space-y-2.5 p-4" id="assurance-payment-modes">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm mx-auto md:mx-0">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base leading-snug">All Indian Payment Methods</h4>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Accepting standard Credit/Debit Cards, UPI scanner, PhonePe, Google Pay, NetBanking and major wallets supported by secure sandbox credentials.</p>
          </div>

          <div className="space-y-2.5 p-4" id="assurance-unlimited-terms">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm mx-auto md:mx-0">
              <Cpu className="w-5 h-5 text-[#10B981]" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base leading-snug">30-Day Money-Back Guarantee</h4>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Try Suryatech completely risk free. If it does not connect to your barcode scanner or prints paper tickets incorrectly, raise a support ticket for full license refunds.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
