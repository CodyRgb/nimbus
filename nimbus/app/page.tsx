"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();
  // Contact Form Logic
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { type, value } = e.target;
    // Handle name splitting if needed or just use simple inputs
    // The new design has First Name and Last Name.
    // I will map them to the state.

    // For this simple implementation, I'll update the state directly by name attribute
    // The HTML inputs need name attributes
  };

  // We need to adapt the state to match the new form fields (First Name, Last Name) 
  // or just keep it simple.
  // Let's refine the state for the new form:
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: ""
  });

  const onContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { placeholder, value, type } = e.target;
    // The HTML didn't have name attributes in the snippet, I will add them.
  };

  // Actually, let's rewrite the component cleanly.

  return (
    <div className="font-display text-white bg-background-dark overflow-x-hidden selection:bg-primary selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full glass-panel border-b-0 border-b-glass-border">
          <div className="layout-container flex justify-center w-full">
            <div className="w-full max-w-[1280px] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="size-8 text-primary">
                  <span className="material-symbols-outlined !text-3xl">cloud_queue</span>
                </div>
                <h2 className="text-white text-xl font-bold tracking-tight">Nimbus</h2>
              </div>
              <div className="hidden lg:flex items-center gap-8">
                <Link className="text-gray-300 hover:text-primary text-sm font-medium transition-colors" href="#features">Features</Link>
                <Link className="text-gray-300 hover:text-primary text-sm font-medium transition-colors" href="#how-it-works">How It Works</Link>
                <Link className="text-gray-300 hover:text-primary text-sm font-medium transition-colors" href="#integration">Integration</Link>
                <Link className="text-gray-300 hover:text-primary text-sm font-medium transition-colors" href="#faq">FAQ</Link>
              </div>
              <div className="flex gap-3">
                {isLoggedIn ? (
                  <Link href={`/${user?.name}/storage`}>
                    <button className="flex cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-[#2563eb] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                      Dashboard
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="hidden sm:flex cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-transparent border border-white/20 text-white text-sm font-bold hover:bg-white/5 transition-all">
                        Login
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="flex cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-[#2563eb] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative flex flex-col justify-center py-20 lg:py-32 px-6">
          <div className="w-full max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 lg:gap-8 z-10">
              <div className="flex flex-col gap-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel w-fit border border-primary/30">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs font-bold text-primary tracking-wide uppercase">New: Telegram Sync V2.0</span>
                </div>
                <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                  Store Unlimited.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-200">Securely.</span>
                </h1>
                <p className="text-gray-400 text-lg lg:text-xl font-normal leading-relaxed max-w-lg">
                  The Cloud, Redefined. Experience unlimited storage power integrated directly with your Telegram account. Fast, encrypted, and free.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href={isLoggedIn ? `/${user?.name}/storage` : "/register"}>
                  <button className="flex items-center justify-center rounded-full h-12 px-8 bg-primary text-white text-base font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform cursor-pointer">
                    {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                  </button>
                </Link>
                <button className="flex items-center justify-center rounded-full h-12 px-8 bg-white/5 border border-white/10 text-white text-base font-bold backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer">
                  <span className="material-symbols-outlined mr-2 text-lg">play_circle</span>
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full border border-[#0f172a] bg-gray-600 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCv1JuaoC66YUbwsO1Z7hU7muaieCRBtHPaJO37hecB3gUhIhP_wcZuwUpq1GabbAicgs-d42cghxbQK5q-fUlydO7Qf_oESMZ1gqy4PMYWpHLMe75MPEf_F5yI4Q3tVHro-f7ay0oZlLhwBsXzfG_4b_n9Q468VWR1eN28Z4Q986_M_OYyJmO_VHerKjyXQeBy88Tk6itELUkIfsDBkyPk7vKXN-KS_Wp-2iA3ZcXDZSePjfmkm-k82ibsMutCNT_Nv7xIZaJCBT0")' }}></div>
                  <div className="size-8 rounded-full border border-[#0f172a] bg-gray-500 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBCn8oXw8UjtaLsCSB1RD7Iim1VgGIAIWMONnyO0AF3MmbTjfrwpTH1sgqk9uUmMiN-j5EM9BrvV8ors6KPoIvadRT6wXCGbtSqcZiiJf6bhw8RAwbVd-Zuz0ZbtfnIHIIn89XgCqxZEGFeo8Qw2ABON9GDLRxqun9nojqo7BNMcD53AUHr44X4lGHFVYNaB6JU9WH5Mp1WcbF8dkkFbVkmSaOjj89-fnd7un2fGMXx0c3XluqbdXDsa_EQ_BIznkJcyfhMF1uNIAc")' }}></div>
                  <div className="size-8 rounded-full border border-[#0f172a] bg-gray-400 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZEztHhPDJviBmwzGSIdoK-A_tHLrbNTFHckW35ImGA7hTzQmutzGL5jQB3iV6KToz_4BZqtyRq7Tmc2LMWz1jqYBGq67Dan9dRLBjOV7efaLmwtqKGT1HSIBQil6mEij0HRf7n1fVzDyOrQGORx8zjIcTLKMRX62SmY1pCyKz-W12xVX4G07D9y1Ki_qh8VOD2QIRXPXuX_w9pA1iH1vBCrCdocsjD8zCWIV39-tyYx4gLNqvSasdgt7C1llNfV5eO6_9RDwXYg")' }}></div>
                </div>
                <p>Trusted by 10,000+ users</p>
              </div>
            </div>
            <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
              <div className="relative w-[80%] aspect-[4/5] sm:aspect-square lg:aspect-[4/5] max-w-[500px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-2xl"></div>
                <div className="absolute inset-0 glass-panel rounded-3xl border border-white/20 p-6 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-red-500/50"></div>
                      <div className="size-3 rounded-full bg-yellow-500/50"></div>
                      <div className="size-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">nimbus_cloud_v2.exe</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center gap-6">
                    <div className="size-24 rounded-2xl bg-gradient-to-br from-gray-700/50 to-black/50 flex items-center justify-center border border-white/5 relative">
                      <span className="material-symbols-outlined text-4xl text-primary animate-bounce">upload_file</span>
                      <div className="absolute -bottom-2 -right-2 size-8 bg-[#2AABEE] rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-sm">send</span>
                      </div>
                    </div>
                    <div className="w-full max-w-[200px] space-y-2">
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Uploading...</span>
                        <span>85%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[85%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 glass-panel rounded-xl flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">lock</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">End-to-End Encrypted</div>
                      <div className="text-[10px] text-gray-400">Keys generated locally</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 top-12 -right-6 w-[80%] h-[80%] glass-panel rounded-3xl border border-white/10 opacity-50 rotate-6"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-black/20" id="features">
          <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-16">
            <div className="flex flex-col gap-4 max-w-[720px]">
              <h2 className="text-4xl font-bold tracking-tight text-white">
                Premium Features.<br />
                <span className="text-gray-500">Zero Compromises.</span>
              </h2>
              <p className="text-gray-400 text-lg">Experience the power of cloud storage built for the modern web.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "all_inclusive", title: "Unlimited Storage", desc: "Leverage the Telegram API to store files without limits. Never delete a memory again." },
                { icon: "security", title: "Military Encryption", desc: "AES-256 encryption ensures your data is unreadable to anyone but you." },
                { icon: "bolt", title: "Lightning Speed", desc: "Optimized routing paths deliver upload and download speeds that maximize your bandwidth." },
                { icon: "folder_zip", title: "Universal Support", desc: "Documents, media, archives, or code. Store any file type up to 2GB per single file." },
              ].map((feature, i) => (
                <div key={i} className="glass-panel glass-card-hover rounded-3xl p-8 flex flex-col gap-4 group cursor-default">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-20 px-6" id="integration">
          <div className="w-full max-w-[1280px] mx-auto glass-panel rounded-[3rem] p-8 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="flex flex-col gap-6 order-2 lg:order-1">
                <div className="flex items-center gap-2 text-[#2AABEE] font-bold uppercase tracking-wider text-sm">
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  Powered by Telegram
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Your chat history,<br />now your hard drive.
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Nimbus acts as a sophisticated layer on top of Telegram. We leverage their robust, globally distributed infrastructure to give you a seamless file management experience. Access your files where you already chat.
                </p>
                <ul className="flex flex-col gap-4 mt-4">
                  {[
                    "Synchronized across all devices",
                    "Native Telegram bot integration",
                    "Zero infrastructure costs for you"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 flex w-fit items-center justify-center rounded-full h-12 px-8 bg-white text-[#0f172a] text-base font-bold hover:bg-gray-200 transition-colors">
                  Learn How It Works
                </button>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-full max-w-[400px] aspect-[4/5] bg-[#1a2c38] rounded-3xl border border-white/10 p-4 shadow-2xl flex flex-col">
                  <div className="bg-[#233542] p-3 rounded-t-xl flex items-center gap-3 mb-4">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">N</div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-bold">Nimbus Storage Bot</span>
                      <span className="text-blue-400 text-xs">bot</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4 p-2 overflow-hidden">
                    <div className="self-start max-w-[85%] bg-[#233542] p-3 rounded-2xl rounded-tl-none text-sm text-gray-200">
                      Welcome back! Send me any file to save it to your cloud.
                    </div>
                    <div className="self-end max-w-[85%] bg-[#2AABEE] p-3 rounded-2xl rounded-tr-none text-sm text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl">description</span>
                      <div>
                        <div className="font-bold">Project_Nimbus_Design.fig</div>
                        <div className="text-[10px] opacity-80">14.2 MB</div>
                      </div>
                    </div>
                    <div className="self-start max-w-[85%] bg-[#233542] p-3 rounded-2xl rounded-tl-none text-sm text-gray-200">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase">
                        <span className="material-symbols-outlined text-sm">cloud_done</span> Saved
                      </div>
                      File securely stored. <br />
                      <span className="underline decoration-primary decoration-2 cursor-pointer">View in Dashboard</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-[#0f172a] p-2 rounded-xl flex items-center gap-2 border border-white/5">
                    <span className="material-symbols-outlined text-gray-500 p-1">attach_file</span>
                    <div className="h-1 bg-gray-600 w-full rounded-full opacity-20"></div>
                    <span className="material-symbols-outlined text-[#2AABEE] p-1">mic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6" id="how-it-works">
          <div className="w-full max-w-[1280px] mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-16">Three steps to infinite storage</h2>
            <div className="relative grid md:grid-cols-3 gap-8">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-0"></div>
              {[
                { icon: "account_circle", title: "1. Connect Account", desc: "Log in securely via Telegram. No email or password required." },
                { icon: "cloud_upload", title: "2. Upload Files", desc: "Drag & drop files to the dashboard or send them to the bot." },
                { icon: "share", title: "3. Share Instantly", desc: "Generate public links or share directly within Telegram chats." },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-6">
                  <div className="size-24 rounded-full glass-panel flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-[#0f172a]">
                    <span className="material-symbols-outlined text-4xl text-primary">{step.icon}</span>
                  </div>
                  <div className="flex flex-col gap-2 max-w-[280px]">
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 bg-black/20" id="faq">
          <div className="w-full max-w-[800px] mx-auto flex flex-col gap-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-400">Everything you need to know about Nimbus.</p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { q: "Is it really unlimited?", a: "Yes! Because we utilize Telegram's API for storage, you inherit their unlimited storage capacity. The only limitation is that individual files cannot exceed 2GB (or 4GB for Telegram Premium users)." },
                { q: "Is my data secure?", a: "Absolutely. We apply an additional layer of AES-256 encryption on top of Telegram's own encryption before your files leave your browser. We do not have access to your keys." },
                { q: "Does it cost money?", a: "Nimbus offers a generous Free tier. We also offer a Pro tier which includes automated backups, folder organization tools, and faster upload speeds through our dedicated relay servers." }
              ].map((faq, i) => (
                <div key={i} className="glass-panel rounded-2xl overflow-hidden">
                  <details className="group">
                    <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                      <span className="font-bold text-white text-lg">{faq.q}</span>
                      <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 px-6" id="contact">
          <div className="w-full max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12">
            <div className="flex flex-col justify-center gap-6">
              <h2 className="text-4xl font-bold text-white">Get in touch</h2>
              <p className="text-gray-400 text-lg">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">mail</span>
                  </div>
                  <span className="text-white">support@nimbus.cloud</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                  </div>
                  <span className="text-white">San Francisco, CA</span>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-8 lg:p-10">
              <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 ml-2">First Name</label>
                    <input className="h-12 rounded-full bg-white/5 border border-white/10 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="John" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 ml-2">Last Name</label>
                    <input className="h-12 rounded-full bg-white/5 border border-white/10 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Doe" type="text" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300 ml-2">Email</label>
                  <input className="h-12 rounded-full bg-white/5 border border-white/10 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="john@example.com" type="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300 ml-2">Message</label>
                  <textarea className="rounded-3xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="How can we help you?" rows={4}></textarea>
                </div>
                <button className="mt-2 flex items-center justify-center rounded-full h-12 bg-primary text-white font-bold hover:bg-[#2563eb] transition-colors cursor-pointer" type="submit">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#020617] pt-16 pb-8 px-6">
          <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              <div className="col-span-2 lg:col-span-2 flex flex-col gap-4 pr-8">
                <div className="flex items-center gap-2 text-white mb-2">
                  <span className="material-symbols-outlined text-primary text-3xl">cloud_queue</span>
                  <span className="text-xl font-bold">Nimbus</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  The secure, unlimited cloud storage solution built for the modern era. Powered by Telegram, secured by us.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-white font-bold">Product</h4>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Features</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Pricing</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">API</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-white font-bold">Company</h4>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">About</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Blog</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Careers</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-white font-bold">Legal</h4>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Privacy</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Terms</Link>
                <Link className="text-gray-400 hover:text-primary text-sm transition-colors" href="#">Security</Link>
              </div>
            </div>
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-xs">© 2023 Nimbus Storage Inc. All rights reserved.</p>
              <div className="flex gap-4">
                <a className="text-gray-400 hover:text-white transition-colors" href="#">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a className="text-gray-400 hover:text-white transition-colors" href="#">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
