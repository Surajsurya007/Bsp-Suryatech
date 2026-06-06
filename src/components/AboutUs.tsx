/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, 
  MapPin, 
  Eye, 
  Users, 
  Sparkles, 
  HeartHandshake, 
  ShieldCheck, 
  History,
  Building2
} from 'lucide-react';

export default function AboutUs() {
  const companyValues = [
    {
      icon: <Eye className="w-5 h-5 text-blue-600" />,
      title: 'Our Clean Vision',
      desc: 'To simplify business operations, stock books, and taxation standards for millions of traditional small retailers across India using super lightweight, cheap offline technology.'
    },
    {
      icon: <Compass className="w-5 h-5 text-emerald-600" />,
      title: 'Our Core Mission',
      desc: 'Deploy resilient desktop solutions which run continuously with zero lag or internet reliability concerns, protecting merchant transaction files and boosting counter lanes speed.'
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-indigo-600" />,
      title: 'Customer Trust first',
      desc: 'Providing standard lifetime license keys without forced subscription contracts or hidden pricing tiers. Ensuring complete merchant ownership over critical database files.'
    }
  ];

  const milestones = [
    { year: '2019', title: 'Company Inception Noida', text: 'BSP Suryatech starts as custom software developers assisting local Kirana stores with automated barcode tracking sheets.' },
    { year: '2021', title: 'Standard Offline Billing launch', text: 'Released our first standard offline billing setup package (v1.0.0) supporting ESC/POS thermal command printers.' },
    { year: '2023', title: 'GST Compliant Export Edition', text: 'Launches full compliance schemes in version 3.0, enabling direct ledger tables exports and GST government JSON file generators.' },
    { year: '2026', title: '14,000+ Active Outlets milestones', text: 'Reaches a landmark target supporting retail registers, pharmacies and hardware dealers across all major states in India.' }
  ];

  return (
    <div className="py-16 space-y-20 pb-24 text-center md:text-left">
      {/* HEADER HERO AREA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">Company Overview</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          Empowering Indian Retail Since 2019
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          BSP Suryatech is a dedicated software development firm located in Noida, India. We are passionate about eliminating manual ledger log mistakes and boosting checkout counter transactional speeds.
        </p>
      </section>

      {/* CORE VISION/MISSION ABOUT CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {companyValues.map((val, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-start text-center md:text-left" id={`about-val-card-${idx}`}>
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 mb-5 mx-auto md:mx-0">
                {val.icon}
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-2">{val.title}</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DETAILED STATS BANNER */}
      <section className="bg-slate-900 text-white py-16 border-y border-slate-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl relative overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-black text-blue-400">7+ Years</div>
            <div className="text-xs text-slate-450 uppercase font-bold tracking-wider mt-1.5">Industry Service</div>
          </div>
          <div>
            <div className="text-4xl font-black text-emerald-450">14,000+</div>
            <div className="text-xs text-slate-450 uppercase font-bold tracking-wider mt-1.5">Active Merchants</div>
          </div>
          <div>
            <div className="text-4xl font-black text-amber-500">20+ States</div>
            <div className="text-xs text-slate-450 uppercase font-bold tracking-wider mt-1.5">Coverage Territory</div>
          </div>
          <div>
            <div className="text-4xl font-black text-violet-400">100% Offline</div>
            <div className="text-xs text-slate-450 uppercase font-bold tracking-wider mt-1.5">SaaS Performance</div>
          </div>
        </div>
      </section>

      {/* COMPANY TIMELINE / HISTORY CHART */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="space-y-4 text-center mb-12">
          <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">Our Development Path Journey</h3>
          <p className="text-xs text-slate-500">Trace our product release milestones and corporate locations shifts over the past seven years.</p>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:md:left-1/2 before:w-0.5 before:bg-slate-200">
          {milestones.map((mil, mIdx) => (
            <div 
              key={mIdx} 
              className={`relative flex flex-col md:flex-row items-start font-medium text-xs sm:text-sm ${
                mIdx % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}
              id={`timeline-milestone-${mIdx}`}
            >
              {/* Dot mark */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />

              {/* Card wrapper */}
              <div className="w-full md:w-[45%] pl-10 md:pl-0 space-y-2 text-left md:px-6">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 py-0.5 px-2 rounded">
                  {mil.year}
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm">{mil.title}</h4>
                <p className="text-slate-500 text-xs leading-normal">{mil.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
