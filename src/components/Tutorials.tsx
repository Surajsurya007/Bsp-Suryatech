/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Tv, 
  BookOpen, 
  Settings, 
  CheckSquare, 
  ArrowRight, 
  Play, 
  Layers, 
  Workflow, 
  ListTodo,
  FileImage,
  Youtube
} from 'lucide-react';

import { VideoTutorial } from '../types';

export default function Tutorials({ videos }: { videos?: VideoTutorial[] }) {
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const defaultVideoTutorials = [
    {
      title: 'Complete Software Overview & POS Retail Setup Guide (v4.2.1)',
      duration: '12:45 Mins',
      youtubeId: 'bsp_overview_embed',
      thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
      description: 'A comprehensive complete video tutorial going through initial registration, barcode creation, Adding custom tax items, setting up standard inventory levels, and executing cash bills.'
    },
    {
      title: 'Configuring Thermal Receipt Printers & Paper Canvas Alignments',
      duration: '08:30 Mins',
      youtubeId: 'bsp_printer_embed',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
      description: 'Step-by-step instructions details covering TVS, Sewoo, Epson, Rongta driver settings, adjusting paper limits parameters, line margins offset spacing, and footer text customizer layouts.'
    },
    {
      title: 'Click Here to Visit Our YouTube Channel',
      duration: '05:40 Mins',
      youtubeId: 'bsp_import_embed',
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      description: 'Visit our official YouTube Channel to watch all BSP Suryatech POS ERP training playlists, printer setup guides, and latest version updates.'
    }
  ];

  const rawVideoTutorials = videos && videos.length > 0 ? videos : defaultVideoTutorials;
  const videoTutorials = rawVideoTutorials.map((vid, vI) => {
    if (vI === 2) {
      return {
        ...vid,
        title: 'Click Here to Visit Our YouTube Channel',
        description: 'Visit our official YouTube Channel to watch all BSP Suryatech POS ERP training playlists, printer setup guides, and latest version updates.'
      };
    }
    return vid;
  });

  const getYoutubeEmbedUrl = (youtubeId: string) => {
    if (!youtubeId) return '';
    if (youtubeId.includes('youtube.com/watch')) {
      const parts = youtubeId.split('?');
      if (parts.length > 1) {
        const urlParams = new URLSearchParams(parts[1]);
        const v = urlParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    }
    if (youtubeId.includes('youtu.be/')) {
      const parts = youtubeId.split('youtu.be/');
      const id = parts[parts.length - 1]?.split('?')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (youtubeId.includes('youtube.com/embed')) {
      return youtubeId;
    }
    if (youtubeId === 'bsp_overview_embed') {
      return 'https://www.youtube.com/embed/zy7emgkNgzA';
    }
    if (youtubeId === 'bsp_printer_embed') {
      return 'https://www.youtube.com/embed/zy7emgkNgzA';
    }
    if (youtubeId === 'bsp_import_embed') {
      return 'https://www.youtube.com/embed/zy7emgkNgzA';
    }
    return `https://www.youtube.com/embed/${youtubeId}`;
  };

  const installSteps = [
    {
      step: 'Step 01',
      title: 'Secure Client Installer Download',
      desc: 'First download the setup executable package from our Download Center (BSPSuryatech_BillingReader_v4.2.1_Setup.exe).'
    },
    {
      step: 'Step 02',
      title: 'Execute Registry Installation Wizard',
      desc: 'Right-click on the client binary, select "Run as Administrator", choose your install directory path (e.g. C:/Suryatech), and click Finish install.'
    },
    {
      step: 'Step 03',
      title: 'Activation License Code Key',
      desc: 'Open Customer Portal page, copy your acquired standard serial registration code, copy-paste into registration wizard inputs fields inside the desktop app, and enter activate.'
    },
    {
      step: 'Step 04',
      title: 'Printer Configurations Setup',
      desc: 'Connect USB POS printer cable line, load Hardware driver settings in control panel, match spooling widths values (58mm/80mm), and perform a sample trial invoice test.'
    }
  ];

  return (
    <div className="py-16 space-y-20 pb-24">
      {/* HEADER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">Video Tutorials & documentation</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          Master Your Billing POS System
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          In-depth video tutorials, installation guides, and complete step-by-step PDF manual references to assist your desk checkout setup without technical delays.
        </p>
      </section>

      {/* DETAILED INTERACTIVE VIDEO INTEGRATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Large active frame mockup */}
          <div className="lg:col-span-7 space-y-6" id="video-mockup-main">
            {activeVideoIndex !== null && videoTutorials[activeVideoIndex] && (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl shadow-slate-100 flex items-center justify-center group">
                  {isPlaying ? (
                    <iframe
                      src={getYoutubeEmbedUrl(videoTutorials[activeVideoIndex].youtubeId) + "?autoplay=1"}
                      title={videoTutorials[activeVideoIndex].title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <>
                      {/* Mock image placeholder background */}
                      <img 
                        src={videoTutorials[activeVideoIndex].thumbnail} 
                        alt={videoTutorials[activeVideoIndex].title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-blue-900/10" />

                      {/* Red/White Big Play button representing video status */}
                      <div 
                        onClick={() => setIsPlaying(true)}
                        className="relative z-10 w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-700 group-hover:scale-110 transition-all cursor-pointer"
                      >
                        <Play className="w-6 h-6 fill-white ml-1" />
                      </div>

                      {/* Video length tag */}
                      <span className="absolute bottom-4 right-4 bg-slate-900/80 px-3 py-1 text-slate-200 text-xs font-mono rounded">
                        {videoTutorials[activeVideoIndex].duration}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight leading-snug">
                    {videoTutorials[activeVideoIndex].title}
                  </h3>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                    {videoTutorials[activeVideoIndex].description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Playlist list navigation buttons */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 font-mono">Tutorial Videos Playlist:</h4>
            
            <div className="space-y-3">
              {videoTutorials.map((vid, vI) => {
                const isYouTubeLink = vI === 2;
                if (isYouTubeLink) {
                  return (
                    <a
                      key={vI}
                      href="https://www.youtube.com/@bspsuryatech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border rounded-2xl cursor-pointer transition-all flex gap-4 text-left items-start border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/30 group"
                      id={`video-playlist-item-${vI}`}
                    >
                      <div className="p-2.5 bg-slate-50 rounded-xl text-red-600 shrink-0 border border-slate-100 transition-colors">
                        <Youtube className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-mono font-bold block">{vid.duration}</span>
                        <h5 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-red-600 transition-colors">{vid.title}</h5>
                      </div>
                    </a>
                  );
                }
                return (
                  <div
                    key={vI}
                    onClick={() => {
                      setActiveVideoIndex(vI);
                      setIsPlaying(false);
                    }}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex gap-4 text-left items-start ${
                      activeVideoIndex === vI 
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/30'
                    }`}
                    id={`video-playlist-item-${vI}`}
                  >
                    <div className="p-2.5 bg-slate-50 rounded-xl text-blue-600 shrink-0 border border-slate-100">
                      <Tv className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 font-mono font-bold block">{vid.duration}</span>
                      <h5 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-blue-600">{vid.title}</h5>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* STEP BY STEP SETUP INSTRUCTIONS TIMELINE */}
      <section className="bg-slate-100 border-y border-slate-200/60 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl">
        <div className="text-center space-y-4 mb-12 max-w-lg mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900">4-Step Quick Install Path</h3>
          <p className="text-xs text-slate-520">From downloader binaries files to printing checkout tickets - standard installation guide sequence layout.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {installSteps.map((ins, iIdx) => (
            <div key={iIdx} className="bg-white border p-6 rounded-2xl shadow-sm space-y-4 text-left" id={`timeline-card-item-${iIdx}`}>
              <span className="font-mono text-sm font-extrabold text-blue-600 tracking-wider bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded">
                {ins.step}
              </span>
              <h5 className="font-extrabold text-slate-800 text-sm leading-snug pt-2">{ins.title}</h5>
              <p className="text-slate-500 text-xs leading-relaxed">{ins.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USER MANUALS ASSETS SHORTCUT CHECKLISTS */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col md:flex-row gap-8 items-center justify-between text-left">
          <div className="space-y-2.5 max-w-md">
            <h4 className="font-black text-xl">Need Premium Setup Assistance?</h4>
            <p className="text-slate-400 text-xs leading-normal">
              Our support operators can assist installing drivers or exporting Excel items over remote desktop solutions (AnyDesk or TeamViewer).
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('whatsapp-instant-chat-btn');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow shrink-0 cursor-pointer"
          >
            Request Free Installer Setup
          </button>
        </div>
      </section>

    </div>
  );
}
