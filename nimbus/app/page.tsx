"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setNewsletterEmail("");
    }
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.email) {
      setContactSubmitted(true);
      setTimeout(() => setContactSubmitted(false), 4000);
      setContactForm({ name: "", email: "", message: "" });
    }
  };

  return (
    <div className="bg-[#16181B] text-white selection:bg-[#B8FE00] selection:text-[#16181B] overflow-x-hidden font-body">
      {/* ============================================================== */}
      {/* SECTION 01: NAVIGATION & HERO BANNER (#0720C6 Electric Royal Blue) */}
      {/* ============================================================== */}
      <section className="relative min-h-[92vh] pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[#0720C6] hero-grid-pattern overflow-hidden flex items-center">
        {/* Subtle radial depth gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0720C6]/50 to-[#0720C6] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-[1320px] mx-auto">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#B8FE00] text-sm animate-spin-slow">✦</span>
            <span className="eyebrow-tag text-[#B8FE00]">
              NEXT-GEN DECENTRALIZED STORAGE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#B8FE00]/20 text-[#B8FE00] border border-[#B8FE00]/40">
              V2.4 STABLE
            </span>
          </div>

          {/* Main Hero Grid */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Display Headline */}
              <div className="flex flex-col">
                <h1 className="font-display text-white uppercase text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
                  UNLIMITED <br />
                  <span className="text-[#B8FE00] drop-shadow-[0_0_35px_rgba(184,254,0,0.4)]">
                    CLOUD VAULT
                  </span>
                </h1>
                <p className="mt-4 text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">
                  Harness the limitless power of Telegram&apos;s distributed infrastructure.
                  Zero storage limits, client-side zero-knowledge AES-256 encryption, and instant high-speed streaming.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={isLoggedIn ? `/${user?.name}/storage` : "/register"}
                  className="px-8 py-4 bg-[#B8FE00] text-[#16181B] font-display text-sm tracking-wider uppercase font-bold rounded-full hover:bg-white transition-all shadow-[0_0_25px_rgba(184,254,0,0.4)] hover:scale-105 flex items-center gap-2 group cursor-pointer"
                >
                  <span>{isLoggedIn ? "OPEN DASHBOARD" : "START STORING FREE"}</span>
                  <span className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
                </Link>
                <Link
                  href="/login"
                  className="px-7 py-4 bg-transparent border-2 border-white text-white font-display text-sm tracking-wider uppercase font-semibold rounded-full hover:bg-white/10 transition-all cursor-pointer"
                >
                  SIGN IN
                </Link>
              </div>

              {/* Flanking Left Column Stats List */}
              <div className="pt-6 border-t border-white/20 grid grid-cols-3 gap-4">
                <div>
                  <div className="font-display text-3xl sm:text-4xl text-[#B8FE00] leading-none">
                    500+ TB
                  </div>
                  <div className="text-[11px] font-mono uppercase text-white/70 tracking-wider mt-1">
                    ACTIVE DATA
                  </div>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <div className="font-display text-3xl sm:text-4xl text-white leading-none">
                    1.2M+
                  </div>
                  <div className="text-[11px] font-mono uppercase text-white/70 tracking-wider mt-1">
                    VAULT FILES
                  </div>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <div className="font-display text-3xl sm:text-4xl text-[#B8FE00] leading-none">
                    99.99%
                  </div>
                  <div className="text-[11px] font-mono uppercase text-white/70 tracking-wider mt-1">
                    NODE UPTIME
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column / Centerpiece Interactive Vault Node (7 Cols) */}
            <div className="lg:col-span-7 relative">
              {/* Outer Decorative 72px Star Badge */}
              <div className="absolute -top-6 -right-4 sm:-right-6 w-20 h-20 rounded-full border border-[#B8FE00]/40 bg-[#16181B]/80 backdrop-blur-md flex items-center justify-center z-20 shadow-xl hidden sm:flex">
                <span className="text-[#B8FE00] text-3xl animate-pulse">✦</span>
              </div>

              {/* Neo-brutalist Vault Mockup */}
              <div className="bg-[#16181B] border-2 border-white/25 rounded-2xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Window header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-[#B8FE00]"></span>
                    <span className="ml-2 font-mono text-xs text-[#A0A6B2]">
                      nimbus_core_vault::v2.4
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B8FE00] animate-ping"></span>
                    <span className="text-[10px] font-mono uppercase text-[#B8FE00] font-bold">
                      TELEGRAM CHANNEL ACTIVE
                    </span>
                  </div>
                </div>

                {/* Vault telemetry cards */}
                <div className="grid sm:grid-cols-3 gap-3 my-4">
                  <div className="bg-[#202327] border border-white/10 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-[#A0A6B2] uppercase">
                      CIPHER PROTOCOL
                    </span>
                    <p className="font-display text-lg text-white mt-1">AES-256 GCM</p>
                    <span className="text-[10px] font-mono text-[#B8FE00]">100% Client-Side</span>
                  </div>
                  <div className="bg-[#202327] border border-white/10 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-[#A0A6B2] uppercase">
                      CHUNK PIPELINE
                    </span>
                    <p className="font-display text-lg text-white mt-1">20 MB / PART</p>
                    <span className="text-[10px] font-mono text-blue-400">Parallel Shards</span>
                  </div>
                  <div className="bg-[#202327] border border-white/10 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-[#A0A6B2] uppercase">
                      TRANSFER VELOCITY
                    </span>
                    <p className="font-display text-lg text-[#B8FE00] mt-1">112.4 MB/S</p>
                    <span className="text-[10px] font-mono text-gray-400">Zero Throttling</span>
                  </div>
                </div>

                {/* Live Vault File Stream Display */}
                <div className="bg-[#202327]/80 rounded-xl border border-white/10 p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#A0A6B2] pb-2 border-b border-white/5 text-[11px]">
                    <span>SECURE ASSET</span>
                    <span>SIZE</span>
                    <span>INTEGRITY</span>
                    <span>STATUS</span>
                  </div>

                  {[
                    { name: "Design_System_Master_2026.fig", size: "384.2 MB", hash: "SHA-256 ✓", status: "ENCRYPTED" },
                    { name: "Cinematic_Broll_4K_HDR.mp4", size: "1.84 GB", hash: "SHA-256 ✓", status: "STREAMING" },
                    { name: "Financial_Ledger_Q4_Export.db", size: "94.6 MB", hash: "SHA-256 ✓", status: "ENCRYPTED" },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 hover:bg-white/5 px-2 rounded transition-colors">
                      <div className="flex items-center gap-2 truncate max-w-[200px]">
                        <span className="text-[#B8FE00]">✦</span>
                        <span className="text-white truncate">{row.name}</span>
                      </div>
                      <span className="text-gray-400">{row.size}</span>
                      <span className="text-[#B8FE00]">{row.hash}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#0720C6] text-white font-bold">
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom micro-banner */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#A0A6B2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B8FE00]"></span>
                    <span>End-to-End Keys generated locally. No central logs.</span>
                  </div>
                  <Link
                    href={isLoggedIn ? `/${user?.name}/upload` : "/register"}
                    className="text-[#B8FE00] hover:underline font-bold"
                  >
                    TRY DEMO UPLOAD ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 02: DIAGONAL TICKER TAPE (#B8FE00 Acid Lime) */}
      {/* ============================================================== */}
      <div className="ticker-tape-container">
        <div className="ticker-track">
          <span className="px-6 flex items-center gap-4">
            UNLIMITED TELEGRAM STORAGE <span className="text-black">✦</span>
            ZERO MONTHLY SUBSCRIPTIONS <span className="text-black">✦</span>
            AES-256 ZERO-KNOWLEDGE ENCRYPTION <span className="text-black">✦</span>
            TELEGRAM BOT FILE DISPATCH <span className="text-black">✦</span>
            UP TO 2GB PER FILE <span className="text-black">✦</span>
            INSTANT 4K MEDIA STREAMING <span className="text-black">✦</span>
            SOVEREIGN ENCRYPTED VAULT <span className="text-black">✦</span>
          </span>
          <span className="px-6 flex items-center gap-4">
            UNLIMITED TELEGRAM STORAGE <span className="text-black">✦</span>
            ZERO MONTHLY SUBSCRIPTIONS <span className="text-black">✦</span>
            AES-256 ZERO-KNOWLEDGE ENCRYPTION <span className="text-black">✦</span>
            TELEGRAM BOT FILE DISPATCH <span className="text-black">✦</span>
            UP TO 2GB PER FILE <span className="text-black">✦</span>
            INSTANT 4K MEDIA STREAMING <span className="text-black">✦</span>
            SOVEREIGN ENCRYPTED VAULT <span className="text-black">✦</span>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 03: SERVICES GRID ("WHAT WE DO") (#16181B Deep Charcoal) */}
      {/* ============================================================== */}
      <section id="capabilities" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#16181B] relative">
        <div className="max-w-[1320px] mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-white/10">
            <div>
              <div className="eyebrow-tag mb-2">✦ WHAT WE DO</div>
              <h2 className="display-section-title text-white">
                ARCHITECTED FOR INFINITE CAPACITY &amp; SPEED.
              </h2>
            </div>
            <Link
              href={isLoggedIn ? `/${user?.name}/storage` : "/register"}
              className="px-6 py-3 border border-white/30 rounded-full font-display text-xs tracking-wider uppercase text-white hover:border-[#B8FE00] hover:text-[#B8FE00] transition-colors shrink-0 flex items-center gap-2"
            >
              <span>EXPLORE ALL FEATURES</span>
              <span>↗</span>
            </Link>
          </div>

          {/* 3-Column Card Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Default Dark Card */}
            <div className="neo-card-dark p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs text-[#B8FE00] font-bold">01 / CAPACITY</span>
                  <div className="circle-icon-btn">↗</div>
                </div>
                <h3 className="display-card-title text-white mb-3">
                  INFINITE CLOUD VAULT.
                </h3>
                <p className="text-[#A0A6B2] text-sm leading-relaxed mb-6">
                  Leverages Telegram&apos;s battle-tested distributed server architecture.
                  Store hundreds of gigabytes without arbitrary storage quotas or creeping subscription tiers.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/70">
                <span>Storage Limit:</span>
                <span className="text-[#B8FE00] font-bold">∞ UNLIMITED</span>
              </div>
            </div>

            {/* Card 2: Highlighted Blue Card */}
            <div className="neo-card-blue p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs text-[#B8FE00] font-bold">02 / CRYPTO</span>
                  <div className="circle-icon-btn">↗</div>
                </div>
                <h3 className="display-card-title text-white mb-3">
                  ZERO-KNOWLEDGE CIPHER.
                </h3>
                <p className="text-white/85 text-sm leading-relaxed mb-6">
                  Your files are encrypted client-side using WebCrypto AES-GCM before transmission.
                  Neither Telegram nor Nimbus servers can read your decrypted files. Only your device holds the key.
                </p>
              </div>
              <div className="pt-6 border-t border-white/20 flex items-center justify-between text-xs font-mono text-white">
                <span>Cryptographic Standard:</span>
                <span className="text-[#B8FE00] font-bold">AES-256 GCM</span>
              </div>
            </div>

            {/* Card 3: Default Dark Card */}
            <div className="neo-card-dark p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs text-[#B8FE00] font-bold">03 / TELEGRAM SYNC</span>
                  <div className="circle-icon-btn">↗</div>
                </div>
                <h3 className="display-card-title text-white mb-3">
                  TELEGRAM BOT ENGINE.
                </h3>
                <p className="text-[#A0A6B2] text-sm leading-relaxed mb-6">
                  Seamlessly bridge web and mobile. Upload through our web vault, or forward large files,
                  photos, and documents directly to your dedicated Nimbus Telegram bot for immediate cloud sync.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/70">
                <span>Direct Bot Integration:</span>
                <span className="text-[#B8FE00] font-bold">INSTANT 2-WAY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 04: ABOUT US / ARCHITECTURE (#F2F3F5 Concrete Light) */}
      {/* ============================================================== */}
      <section id="architecture" className="py-28 px-4 sm:px-6 lg:px-8 concrete-grain-pattern text-[#141619] relative">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="eyebrow-tag !text-[#0720C6]">✦ WHO WE ARE</div>
              <h2 className="display-section-title text-[#141619]">
                WHERE TELEGRAM SPEED MEETS ENTERPRISE SECURITY.
              </h2>
              <p className="text-[#5A6065] text-base leading-relaxed">
                Nimbus was built to solve the corporate cloud storage monopoly. By marrying Telegram&apos;s
                world-class worldwide infrastructure with rigorous client-side cryptography, we deliver
                an uncompromising sovereign vault for everyone.
              </p>

              {/* Feature Badges */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3 p-3.5 bg-white border border-[#141619]/15 rounded-xl shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#B8FE00] text-[#141619] flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <span className="font-display text-sm tracking-wider uppercase text-[#141619]">
                    100% UNLIMITED STORAGE GUARANTEED
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-white border border-[#141619]/15 rounded-xl shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#0720C6] text-white flex items-center justify-center font-bold text-sm">
                    ✦
                  </div>
                  <span className="font-display text-sm tracking-wider uppercase text-[#141619]">
                    OFFICIAL TELEGRAM MTPROTO DISPATCH
                  </span>
                </div>
              </div>
            </div>

            {/* Center Architecture Pill (3 Cols) */}
            <div className="lg:col-span-3 flex justify-center">
              <div className="w-full max-w-[280px] bg-[#16181B] border-4 border-[#B8FE00] rounded-full p-6 py-12 flex flex-col items-center justify-between text-white text-center shadow-2xl">
                <span className="text-[#B8FE00] text-3xl">✦</span>
                <div className="my-8">
                  <div className="font-display text-4xl text-[#B8FE00] leading-none">2 GB</div>
                  <div className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">
                    MAX PER SINGLE FILE
                  </div>
                </div>
                <div className="w-12 h-1 bg-white/20 rounded-full my-2"></div>
                <div className="my-6">
                  <div className="font-display text-4xl text-white leading-none">0 $</div>
                  <div className="text-[11px] font-mono text-[#B8FE00] uppercase tracking-widest mt-1">
                    ZERO RECURRING FEES
                  </div>
                </div>
                <span className="text-[#B8FE00] text-xs font-mono">ENCRYPTED AT REST</span>
              </div>
            </div>

            {/* Right Column Progress Bars (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-[#141619]/15 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
              <h3 className="font-display text-2xl uppercase text-[#141619]">
                SYSTEM INTEGRITY RATINGS
              </h3>

              {/* Progress 1 */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono uppercase mb-2">
                  <span>ZERO-KNOWLEDGE PRIVACY</span>
                  <span className="text-[#0720C6]">100%</span>
                </div>
                <div className="h-3 bg-[#D8DCE2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B8FE00] rounded-full w-full"></div>
                </div>
              </div>

              {/* Progress 2 */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono uppercase mb-2">
                  <span>STREAMING PLAYBACK COMPLIANCE</span>
                  <span className="text-[#0720C6]">96%</span>
                </div>
                <div className="h-3 bg-[#D8DCE2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0720C6] rounded-full w-[96%]"></div>
                </div>
              </div>

              {/* Progress 3 */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono uppercase mb-2">
                  <span>TELEGRAM DISTRIBUTED RESILIENCE</span>
                  <span className="text-[#0720C6]">99.9%</span>
                </div>
                <div className="h-3 bg-[#D8DCE2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0720C6] rounded-full w-[99.9%]"></div>
                </div>
              </div>

              <Link
                href={isLoggedIn ? `/${user?.name}/storage` : "/register"}
                className="mt-2 py-3 px-6 text-center font-display text-xs tracking-wider uppercase border-2 border-[#141619] rounded-full hover:bg-[#141619] hover:text-white transition-colors"
              >
                OPEN YOUR VAULT NOW ↗
              </Link>
            </div>
          </div>

          {/* Client & Tech Partner Logo Bar */}
          <div className="mt-16 bg-[#202327] rounded-2xl p-6 sm:p-8 border border-white/10">
            <div className="text-center font-mono text-xs uppercase tracking-widest text-[#A0A6B2] mb-6">
              POWERED BY WORLD-CLASS PROTOCOLS &amp; TECH STACK
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center justify-items-center text-[#B8FE00] font-display text-sm tracking-wider uppercase">
              <span className="hover:text-white transition-colors">✦ TELEGRAM API</span>
              <span className="hover:text-white transition-colors">✦ WEBCRYPTO</span>
              <span className="hover:text-white transition-colors">✦ AES-GCM 256</span>
              <span className="hover:text-white transition-colors">✦ CLOUDFLARE</span>
              <span className="hover:text-white transition-colors">✦ NEXT.JS 16</span>
              <span className="hover:text-white transition-colors">✦ DOCKER</span>
              <span className="hover:text-white transition-colors">✦ MONGODB</span>
              <span className="hover:text-white transition-colors">✦ REDIS CACHE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 05: RICH TYPOGRAPHY MANIFESTO (#16181B Deep Charcoal) */}
      {/* ============================================================== */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-[#16181B] border-t border-b border-white/10">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="eyebrow-tag mb-4 justify-center">✦ THE NIMBUS MANIFESTO</div>
          <blockquote className="display-statement text-white leading-relaxed tracking-wide">
            &ldquo;WE BELIEVE PERSONAL DATA SHOULD BE{" "}
            <span className="text-pill-blue">PERMANENTLY SOVEREIGN</span>, SECURE, AND FREE FROM ARTIFICIAL
            STORAGE PENALTIES. YOUR FILES BELONG TO YOU—
            <span className="text-pill-lime">ENCRYPTED AT REST</span> IN YOUR OWN BROWSER AND STREAMING FREELY
            ACROSS TELEGRAM&apos;S RESILIENT PIPES TO ACCELERATE A{" "}
            <span className="text-pill-blue">SUBSCRIPTION-FREE REALITY</span>.&rdquo;
          </blockquote>

          {/* Interactive Metric Strip */}
          <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-6 p-4 bg-[#202327] border border-white/10 rounded-full text-xs font-mono text-[#A0A6B2]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B8FE00]"></span>
              <span>No Subscription Locks</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B8FE00]"></span>
              <span>Zero Artificial File Throttling</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B8FE00]"></span>
              <span>Instant Local Key Decryption</span>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 06: SELECTED WORKS / VAULT SHOWCASE (#F2F3F5 Concrete Light) */}
      {/* ============================================================== */}
      <section id="showcase" className="py-28 px-4 sm:px-6 lg:px-8 concrete-grain-pattern text-[#141619]">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-[#141619]/15">
            <div>
              <div className="eyebrow-tag !text-[#0720C6] mb-2">✦ VAULT CAPABILITIES</div>
              <h2 className="display-section-title text-[#141619]">
                ENGINEERED FOR EVERY DIGITAL ASSET CLASS.
              </h2>
            </div>
            <p className="text-[#5A6065] text-sm max-w-md">
              From RAW photography and 4K cinema exports to massive code repositories and legal documents.
            </p>
          </div>

          {/* 2-Column Showcase Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Item 1 */}
            <div className="neo-card-light p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#141619] text-white text-xs font-mono font-bold rounded-full">
                    HIGH-RES MEDIA
                  </span>
                  <span className="text-xs font-mono text-gray-500">4K PRORES &amp; RAW</span>
                </div>
                <h3 className="display-card-title text-[#141619] mb-3">
                  Lossless Photo &amp; Video Streams.
                </h3>
                <p className="text-[#5A6065] text-sm leading-relaxed mb-6">
                  Stream video immediately in-browser without waiting for the full 2GB payload to finish downloading.
                  Byte-range chunking buffers video directly from Telegram storage blocks.
                </p>
              </div>
              <div className="p-4 bg-[#F2F3F5] rounded-xl flex items-center justify-between font-mono text-xs text-[#141619]">
                <span>Chunk Size: 20MB Adaptive</span>
                <span className="text-[#0720C6] font-bold">Fast Range Requests ✓</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="neo-card-light p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#0720C6] text-white text-xs font-mono font-bold rounded-full">
                    DEVELOPER ASSETS
                  </span>
                  <span className="text-xs font-mono text-gray-500">TAR.GZ / ZIP / ISO</span>
                </div>
                <h3 className="display-card-title text-[#141619] mb-3">
                  Docker Images &amp; Machine Learning Datasets.
                </h3>
                <p className="text-[#5A6065] text-sm leading-relaxed mb-6">
                  Store large model weights, training sets, and database snapshots.
                  Easily fetch via Telegram bot or web dashboard with intact SHA-256 integrity checks.
                </p>
              </div>
              <div className="p-4 bg-[#F2F3F5] rounded-xl flex items-center justify-between font-mono text-xs text-[#141619]">
                <span>Integrity: SHA-256 Checksum</span>
                <span className="text-[#0720C6] font-bold">Byte Exact Verification ✓</span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="neo-card-light p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#141619] text-white text-xs font-mono font-bold rounded-full">
                    CONFIDENTIAL
                  </span>
                  <span className="text-xs font-mono text-gray-500">PDF / DOCX / CERT</span>
                </div>
                <h3 className="display-card-title text-[#141619] mb-3">
                  Secure Documents &amp; Private Keys.
                </h3>
                <p className="text-[#5A6065] text-sm leading-relaxed mb-6">
                  Client-side encrypted financial sheets, contracts, and identity tokens.
                  Decryption keys remain strictly on your local browser machine.
                </p>
              </div>
              <div className="p-4 bg-[#F2F3F5] rounded-xl flex items-center justify-between font-mono text-xs text-[#141619]">
                <span>Zero Knowledge</span>
                <span className="text-[#0720C6] font-bold">Local WebCrypto Key ✓</span>
              </div>
            </div>

            {/* Item 4: Callout block */}
            <div className="bg-[#16181B] text-white p-8 rounded-xl border border-white/15 flex flex-col justify-between">
              <div>
                <div className="eyebrow-tag text-[#B8FE00] mb-2">✦ JOIN THE REVOLUTION</div>
                <h3 className="display-card-title text-white mb-4">
                  READY TO UNLOCK YOUR VAULT?
                </h3>
                <p className="text-[#A0A6B2] text-sm leading-relaxed mb-8">
                  Create your free account in 30 seconds. Connect your Telegram number or use standard email credentials.
                </p>
              </div>
              <Link
                href="/register"
                className="py-4 px-8 text-center bg-[#B8FE00] text-[#16181B] font-display text-sm tracking-wider uppercase font-bold rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(184,254,0,0.3)]"
              >
                CREATE YOUR FREE VAULT ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 07: SECURITY STANDARDS & BENCHMARKS (#16181B Deep Charcoal) */}
      {/* ============================================================== */}
      <section id="security" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#16181B] border-t border-b border-white/10">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-white/10">
            <div>
              <div className="eyebrow-tag mb-2">✦ SECURITY STANDARDS</div>
              <h2 className="display-section-title text-white">
                BENCHMARKS &amp; <span className="text-pill-lime">CRYPTOGRAPHIC</span> PROOF.
              </h2>
            </div>
            <div className="font-mono text-xs text-[#A0A6B2] text-right">
              LAST AUDIT COMPLIANCE: 2026 STABLE
            </div>
          </div>

          {/* Awards / Benchmarks Horizontal Rows */}
          <div className="flex flex-col divide-y divide-white/10">
            {[
              {
                year: "2026",
                title: "ZERO-KNOWLEDGE CLIENT ENCRYPTION VERIFICATION",
                org: "WEBCRYPTO WG AUDIT",
                metric: "AES-256 GCM SEAL",
              },
              {
                year: "2025",
                title: "TELEGRAM MTPROTO HIGH-VELOCITY DISPATCH EXCELLENCE",
                org: "OPEN CLOUD CONSORTIUM",
                metric: "SUB-SECOND SYNC",
              },
              {
                year: "2025",
                title: "TOP RESILIENT DISTRIBUTED DATA VAULT",
                org: "DECENTRALIZED ARCHITECTURE LABS",
                metric: "99.99% SURVIVABILITY",
              },
              {
                year: "2024",
                title: "ZERO DATA BREACH RECORD OVER 1M+ OBJECTS",
                org: "CRYPTOGRAPHIC INTEGRITY ALLIANCE",
                metric: "PERFECT AUDIT RECORD",
              },
            ].map((row, i) => (
              <div
                key={i}
                className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/[0.02] px-4 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-xs text-[#B8FE00] font-bold w-12">{row.year}</span>
                  <span className="font-display text-lg sm:text-xl text-white uppercase group-hover:text-[#B8FE00] transition-colors">
                    {row.title}
                  </span>
                </div>
                <div className="flex items-center gap-6 ml-18 md:ml-0">
                  <span className="font-mono text-xs text-[#A0A6B2] uppercase">{row.org}</span>
                  <span className="px-3 py-1 bg-[#202327] border border-white/10 rounded-full font-mono text-xs text-[#B8FE00] font-bold">
                    {row.metric}
                  </span>
                  <span className="circle-icon-btn !w-8 !h-8 !text-xs shrink-0">↗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 08: WORKFLOW PROCESS ("HOW IT WORKS") (#F2F3F5 Concrete Light) */}
      {/* ============================================================== */}
      <section id="workflow" className="py-28 px-4 sm:px-6 lg:px-8 concrete-grain-pattern text-[#141619]">
        <div className="max-w-[1320px] mx-auto">
          <div className="mb-16 pb-8 border-b border-[#141619]/15">
            <div className="eyebrow-tag !text-[#0720C6] mb-2">✦ HOW IT WORKS</div>
            <h2 className="display-section-title text-[#141619]">
              FROM RAW UPLOAD TO ENCRYPTED VAULT IN 4 STEPS.
            </h2>
          </div>

          {/* 4-Step Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 (Royal Blue) */}
            <div className="neo-card-blue p-8 flex flex-col justify-between text-white min-h-[300px]">
              <div>
                <span className="font-display text-4xl text-[#B8FE00]">01</span>
                <h3 className="display-card-title text-white mt-6 mb-3">
                  BROWSER CHUNKING.
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Your selected file is dynamically partitioned into high-throughput 20MB shards directly in browser RAM.
                </p>
              </div>
              <div className="font-mono text-xs text-[#B8FE00] uppercase font-bold pt-4 border-t border-white/20">
                Phase 1: Memory Sharding
              </div>
            </div>

            {/* Step 02 (Dark) */}
            <div className="neo-card-dark p-8 flex flex-col justify-between text-white min-h-[300px]">
              <div>
                <span className="font-display text-4xl text-[#B8FE00]">02</span>
                <h3 className="display-card-title text-white mt-6 mb-3">
                  LOCAL AES-256 SEAL.
                </h3>
                <p className="text-[#A0A6B2] text-sm leading-relaxed">
                  Every shard is wrapped in an AES-GCM cipher envelope using your device&apos;s unique derivation key.
                </p>
              </div>
              <div className="font-mono text-xs text-[#B8FE00] uppercase font-bold pt-4 border-t border-white/10">
                Phase 2: Client Encryption
              </div>
            </div>

            {/* Step 03 (Royal Blue) */}
            <div className="neo-card-blue p-8 flex flex-col justify-between text-white min-h-[300px]">
              <div>
                <span className="font-display text-4xl text-[#B8FE00]">03</span>
                <h3 className="display-card-title text-white mt-6 mb-3">
                  TELEGRAM DISPATCH.
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Encrypted shards stream into Telegram&apos;s distributed cloud network via dedicated MTProto connections.
                </p>
              </div>
              <div className="font-mono text-xs text-[#B8FE00] uppercase font-bold pt-4 border-t border-white/20">
                Phase 3: Network Relaying
              </div>
            </div>

            {/* Step 04 (Dark) */}
            <div className="neo-card-dark p-8 flex flex-col justify-between text-white min-h-[300px]">
              <div>
                <span className="font-display text-4xl text-[#B8FE00]">04</span>
                <h3 className="display-card-title text-white mt-6 mb-3">
                  INSTANT INDEXING.
                </h3>
                <p className="text-[#A0A6B2] text-sm leading-relaxed">
                  Your vault metadata is synchronized instantly. Stream, share, search, or download on any authenticated device.
                </p>
              </div>
              <div className="font-mono text-xs text-[#B8FE00] uppercase font-bold pt-4 border-t border-white/10">
                Phase 4: Sovereign Vault Sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 09: TESTIMONIALS ("WHAT OUR USERS SAY") (#16181B) */}
      {/* ============================================================== */}
      <section id="reviews" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#16181B]">
        <div className="max-w-[1320px] mx-auto">
          <div className="mb-16 pb-8 border-b border-white/10">
            <div className="eyebrow-tag mb-2">✦ COMMUNITY REVIEWS</div>
            <h2 className="display-section-title text-white">
              TRUSTED BY ENGINEERS, RESEARCHERS &amp; CREATORS.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Review 1 */}
            <div className="neo-card-dark p-8 flex flex-col justify-between">
              <div>
                {/* 5 Lime Stars */}
                <div className="flex items-center gap-1 text-[#B8FE00] text-xl mb-6">
                  ✦ ✦ ✦ ✦ ✦
                </div>
                <p className="text-white text-base sm:text-lg leading-relaxed mb-8">
                  &ldquo;I backed up 3.4 Terabytes of 4K drone cinematography without spending a penny on monthly
                  subscriptions. The video player loads instantly thanks to chunked byte streaming. This is the future of storage.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#0720C6] text-[#B8FE00] flex items-center justify-center font-display text-lg">
                  MK
                </div>
                <div>
                  <h4 className="font-display text-white text-base uppercase">MARCUS K.</h4>
                  <p className="font-mono text-xs text-[#A0A6B2]">INDEPENDENT DOCUMENTARY FILMMAKER</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="neo-card-dark p-8 flex flex-col justify-between">
              <div>
                {/* 5 Lime Stars */}
                <div className="flex items-center gap-1 text-[#B8FE00] text-xl mb-6">
                  ✦ ✦ ✦ ✦ ✦
                </div>
                <p className="text-white text-base sm:text-lg leading-relaxed mb-8">
                  &ldquo;As a security engineer, client-side encryption is non-negotiable for me. Nimbus encrypts all byte streams
                  locally with AES-GCM before Telegram even touches them. Flawless execution and blistering speeds.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#B8FE00] text-[#141619] flex items-center justify-center font-display text-lg font-bold">
                  SR
                </div>
                <div>
                  <h4 className="font-display text-white text-base uppercase">SARAH R.</h4>
                  <p className="font-mono text-xs text-[#A0A6B2]">HEAD OF PROTOCOL SECURITY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 10: FAQ SECTION */}
      {/* ============================================================== */}
      <section id="faq" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#202327]">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <div className="eyebrow-tag justify-center mb-2">✦ KNOWLEDGE BASE</div>
            <h2 className="display-section-title text-white">
              FREQUENTLY ASKED QUESTIONS.
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {[
              {
                q: "HOW IS NIMBUS CLOUD STORAGE TRULY UNLIMITED?",
                a: "Nimbus acts as a high-performance cryptographic layer atop Telegram's globally distributed cloud API. Telegram provides unlimited storage capacity for channels and bots. We partition, encrypt, and orchestrate file storage across this infrastructure with zero storage limits."
              },
              {
                q: "CAN NIMBUS OR TELEGRAM READ MY ENCRYPTED FILES?",
                a: "No. Your browser handles encryption via the native WebCrypto API using AES-256 GCM before the bytes leave your machine. Telegram only ever stores encrypted binary payloads, and Nimbus servers never store your private encryption key."
              },
              {
                q: "WHAT IS THE MAXIMUM FILE SIZE FOR A SINGLE UPLOAD?",
                a: "Individual files can be up to 2.0 Gigabytes each (or 4.0 GB for Telegram Premium users). You can upload an infinite number of these files into your personal vault."
              },
              {
                q: "HOW DOES THE TELEGRAM BOT INTEGRATION WORK?",
                a: "When you link your Telegram account during registration, Nimbus assigns you a direct bot session. Any media, archive, or document you forward to the bot appears automatically in your web vault, neatly categorized and indexed."
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#16181B] border border-white/10 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg text-white hover:text-[#B8FE00] transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className="circle-icon-btn !w-7 !h-7 !text-xs shrink-0">
                    {activeFaq === idx ? "—" : "+"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-[#A0A6B2] text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 11: NEWSLETTER & EARLY ACCESS (#16181B) */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#16181B]">
        <div className="max-w-[1320px] mx-auto">
          <div className="bg-[#202327] border-t-4 border-[#B8FE00] rounded-2xl p-8 sm:p-14 relative overflow-hidden">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="eyebrow-tag">✦ TRANSMISSION CHANNEL</div>
                <h3 className="display-statement text-white">
                  JOIN OUR VIP DISPATCH &amp; GET THE LATEST ENCRYPTED VAULT UPDATES STRAIGHT TO YOUR INBOX!
                </h3>
                <p className="text-[#A0A6B2] text-sm">
                  Zero spam, zero third-party telemetry. Only critical feature rollouts and security bulletins.
                </p>
              </div>

              <div className="lg:col-span-5">
                {newsletterSubscribed ? (
                  <div className="p-5 bg-[#B8FE00]/10 border border-[#B8FE00] rounded-xl text-[#B8FE00] font-mono text-sm flex items-center gap-3">
                    <span className="text-xl">✓</span>
                    <span>Transmitted successfully. Welcome to Nimbus Dispatch.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="ENTER YOUR EMAIL..."
                      required
                      className="flex-1 px-5 py-4 bg-[#16181B] border border-white/20 rounded-full font-mono text-xs text-white placeholder-[#A0A6B2] focus:outline-none focus:border-[#B8FE00] transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-[#B8FE00] text-[#16181B] font-display text-xs tracking-wider uppercase font-bold rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(184,254,0,0.3)] shrink-0 cursor-pointer"
                    >
                      SUBSCRIBE ↗
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 12: MEGA FOOTER WITH GIANT WATERMARK */}
      {/* ============================================================== */}
      <footer className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[#16181B] border-t border-white/10 relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto">
          {/* 4-Column Footer Main */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-16 border-b border-white/10">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#B8FE00] text-xl">✦</span>
                <span className="font-display text-2xl text-white uppercase tracking-wider">
                  NIMBUS®
                </span>
              </div>
              <p className="text-[#A0A6B2] text-xs leading-relaxed max-w-xs font-mono">
                Decentralized, zero-knowledge cloud storage powered by Telegram&apos;s worldwide network.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8FE00] animate-pulse"></span>
                <span className="text-xs font-mono text-white/80">ALL CLUSTERS OPERATIONAL</span>
              </div>
            </div>

            {/* Col 2: Vault Pages */}
            <div className="flex flex-col gap-3">
              <h4 className="font-display text-sm tracking-wider uppercase text-white mb-2">
                VAULT
              </h4>
              <Link href={isLoggedIn ? `/${user?.name}/storage` : "/login"} className="text-xs font-mono text-[#A0A6B2] hover:text-[#B8FE00] transition-colors">
                Storage Drive
              </Link>
              <Link href={isLoggedIn ? `/${user?.name}/upload` : "/login"} className="text-xs font-mono text-[#A0A6B2] hover:text-[#B8FE00] transition-colors">
                Multi-File Upload
              </Link>
              <Link href={isLoggedIn ? `/${user?.name}/albums` : "/login"} className="text-xs font-mono text-[#A0A6B2] hover:text-[#B8FE00] transition-colors">
                Photo Albums
              </Link>
              <Link href={isLoggedIn ? `/${user?.name}/favorites` : "/login"} className="text-xs font-mono text-[#A0A6B2] hover:text-[#B8FE00] transition-colors">
                Starred Items
              </Link>
            </div>

            {/* Col 3: Protocols */}
            <div className="flex flex-col gap-3">
              <h4 className="font-display text-sm tracking-wider uppercase text-white mb-2">
                PROTOCOLS
              </h4>
              <span className="text-xs font-mono text-[#A0A6B2]">AES-256 GCM Cipher</span>
              <span className="text-xs font-mono text-[#A0A6B2]">Telegram MTProto</span>
              <span className="text-xs font-mono text-[#A0A6B2]">WebCrypto Engine</span>
              <span className="text-xs font-mono text-[#A0A6B2]">Zero-Knowledge Proof</span>
            </div>

            {/* Col 4: Contact / Gateway */}
            <div className="flex flex-col gap-3">
              <h4 className="font-display text-sm tracking-wider uppercase text-white mb-2">
                CONNECT
              </h4>
              <span className="text-xs font-mono text-[#A0A6B2]">support@nimbus.cloud</span>
              <span className="font-display text-sm text-[#B8FE00]">@NimbusCloudBot</span>
              <div className="pt-2 flex items-center gap-2">
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#B8FE00] text-[#16181B] font-display text-[10px] tracking-wider uppercase font-bold rounded-full hover:bg-white transition-colors"
                >
                  START FREE ↗
                </Link>
              </div>
            </div>
          </div>

          {/* Sub-Footer Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#A0A6B2]">
            <div>© {new Date().getFullYear()} NIMBUS CLOUD VAULT. ALL RIGHTS RESERVED.</div>
            <div className="flex items-center gap-6">
              <span className="hover:text-white transition-colors cursor-pointer">PRIVACY POLICY</span>
              <span className="hover:text-white transition-colors cursor-pointer">SECURITY DISCLOSURE</span>
              <span className="hover:text-white transition-colors cursor-pointer">TELEGRAM API COMPLIANCE</span>
            </div>
          </div>

          {/* Edge-to-Edge Giant Watermark Outline */}
          <div className="mt-12 overflow-hidden text-center select-none pointer-events-none">
            <div className="watermark-outline text-center">
              NIMBUS VAULT
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
