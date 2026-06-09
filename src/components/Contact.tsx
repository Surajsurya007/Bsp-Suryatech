/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ContactProps {
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
}

export default function Contact({ onAddNotification }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Buying Query',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [helpline, setHelpline] = useState<string>('+91 95535 28282');

  useEffect(() => {
    fetch('/api/helpline')
      .then(res => res.json())
      .then(data => {
        if (data && data.helpline) {
          setHelpline(data.helpline);
        }
      })
      .catch(err => console.error('Failed to load helpline', err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      onAddNotification('Please fill in Name, Email, and Message', 'error');
      return;
    }

    setLoading(true);
    // Simulate API form submission
    setTimeout(() => {
      onAddNotification('Your message was dispatched successfully! Our Noida tech desk will contact you shortly.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Buying Query',
        message: ''
      });
      setLoading(false);
    }, 1200);
  };

  const contactOptions = [
    {
      icon: <Phone className="w-5 h-5 text-blue-600" />,
      title: 'Sales Hotline Desk',
      detail: helpline,
      label: 'Mon - Sat: 9:30 AM to 6:30 PM'
    },
    {
      icon: <Mail className="w-5 h-5 text-emerald-600" />,
      title: 'Email Communications',
      detail: 'support@bspsuryatech.in',
      label: 'SLA response: Under 4 hours'
    },
    {
      icon: <MapPin className="w-5 h-5 text-rose-600" />,
      title: 'Corporate Office HQ',
      detail: 'Sector 3, Shivanand Nagar, Raipur Chhattisgarh',
      label: 'Suryatech Tower, Electronic City - 201301'
    }
  ];

  return (
    <div className="py-16 space-y-20 pb-24 text-center md:text-left">
      {/* HEADER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">Contact Channels</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          Let’s Resolve Your POS Billing Queries
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          Connect directly with our Sector 62 technical workspace. Submit buying inquiries, receive license activation help, or get remote setup debugging support.
        </p>
      </section>

      {/* CORE CONTACT DETAILS & INTERACTIVE FORM CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Details block */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="font-extrabold text-slate-900 text-2.5xl leading-tight">Noida Office Direct Lines</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We maintain active technical helpdesks in Uttar Pradesh to assist our nationwide merchants over telephones, emails, and live video support channels.
              </p>
            </div>

            <div className="space-y-4">
              {contactOptions.map((opt, oIdx) => (
                <div key={oIdx} className="bg-white p-5 border border-slate-200 rounded-2xl flex gap-4 text-left shadow-sm" id={`contact-option-${oIdx}`}>
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    {opt.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{opt.title}</h4>
                    <span className="font-mono text-xs text-blue-600 block mt-1.5 font-bold">{opt.detail}</span>
                    <span className="text-[10.5px] text-slate-450 block mt-1 leading-none">{opt.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Instant WhatsApp block */}
            <div className="bg-emerald-50 border border-emerald-150 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-center text-left justify-between" id="quick-whatsapp-contact-box">
              <div className="space-y-1 max-w-xs">
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase font-mono tracking-wider">Fastest Reply Channel</span>
                <h4 className="font-extrabold text-emerald-900 text-sm">Need Instant Purchase Quote?</h4>
                <p className="text-emerald-700 text-xs leading-normal">Our sales engineers reply on WhatsApp under 5 minutes to generate custom corporate invoicing sheets.</p>
              </div>
              <a
                href="https://wa.me/919553528282?text=Hi%20Suryatech%20I%20have%20billing%20billing%20enquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider shadow shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>WhatsApp Quote</span>
              </a>
            </div>
          </div>

          {/* Right Direct Email Support Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm" id="user-contact-form-block">
            <div className="text-left space-y-1 mb-6">
              <h3 className="font-black text-slate-900 text-lg">Send Dynamic Message</h3>
              <p className="text-slate-400 text-xs">Complete core fields to dispatch message details to Noida inbox queues.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-mono tracking-wide uppercase block">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjay Dixit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                    id="contact-form-name"
                  />
                </div>
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-mono tracking-wide uppercase block">Business Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                    id="contact-form-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-mono tracking-wide uppercase block">Mobile Digit Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98XXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-mono tracking-wide uppercase block">Topic Category</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                  >
                    <option value="Buying Query">Buying Query (Software Licenses)</option>
                    <option value="License Issue">License Key Activation Issue</option>
                    <option value="Technical Bug">Thermal Printer Configuration Help</option>
                    <option value="Composition Schemes">Composition Schemes / Excel Catalogues</option>
                  </select>
                </div>
              </div>

              <div className="text-left space-y-1">
                <label className="text-xs font-bold text-slate-600 font-mono tracking-wide uppercase block">Message Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail store setups questions or hardware lines here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors resize-none"
                  id="contact-form-msg"
                />
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow cursor-pointer transition-colors"
                  id="contact-form-submit-btn"
                >
                  {loading ? 'Sending Message...' : 'Dispatch Message'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* NOIDA MAPS GEOLOCATION ACCREDITATION MOCKUP PANEL */}
      <section className="bg-slate-100 py-16 border-y border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl overflow-hidden text-center">
        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          <h3 className="text-2xl font-black text-slate-900">Our Corporate Geolocation</h3>
          <p className="text-xs text-slate-500">BSP Suryatech Tower is located inside the prestigious Noida Electronic City tech corridor, enabling swift accessibility for on-premise consultations.</p>
        </div>
        {/* Render a highly styled vector-based clean layout representing a Google Map frame mockup */}
        <div className="relative h-72 rounded-2xl bg-sky-950 overflow-hidden border border-slate-800 shadow-sm flex items-center justify-center" id="google-maps-mockup-frame">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0369a1_0%,#090d16_80%)] opacity-80" />
          {/* Vector Streets representation lines */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_46%,#1e293b_47%,#1e293b_49%,transparent_50%),linear-gradient(-45deg,transparent_46%,#1e293b_47%,#1e293b_49%,transparent_50%)] bg-[size:3rem_3rem] opacity-30" />
          
          <div className="relative z-10 p-5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl max-w-sm text-left shadow-lg">
            <span className="text-[9px] text-[#2563EB] font-bold uppercase tracking-widest font-mono">MAP LOCATION ACCREDIT</span>
            <h4 className="font-extrabold text-sm text-white mt-1">BSP Suryatech Tower Noida</h4>
            <p className="text-[11.5px] text-slate-400 leading-normal mt-1 mb-3">Sector 62, Electronic City near Fortis Hospital metro station, Noida - 201301</p>
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-3">
              <span>Google Maps Coordinates</span>
              <span className="font-mono text-blue-400 font-semibold uppercase">28.6273° N, 77.3725° E</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
