"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ParticleBackground from "./components/ui/ParticleBackground";
import GlassCard from "./components/ui/GlassCard";
import MagneticButton from "./components/ui/MagneticButton";
// import AnimatedCounter from "./components/ui/AnimatedCounter";

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    alert("Thank you for contacting us! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const faqs = [
    {
      question: "Is the storage really unlimited?",
      answer:
        "Yes! We leverage Telegram's infrastructure which provides unlimited storage for your files. You can upload as many files as you need without worrying about storage limits.",
    },
    {
      question: "What file types are supported?",
      answer:
        "We support all file types including images, videos, documents, archives (ZIP, RAR), audio files, and more. Each file can be up to 2GB in size.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely! Your files are stored using Telegram&#39;s secure infrastructure with end-to-end encryption. We take your privacy seriously and never access your files without permission.",
    },
    {
      question: "Do I need a Telegram account?",
      answer:
        "Yes, you'll need to connect your Telegram account to use our service. This allows us to securely store your files in your personal Telegram storage space.",
    },
    {
      question: "Can I access my files from multiple devices?",
      answer:
        "Yes! Once uploaded, you can access your files from any device by logging into your account. Your files are synced across all your devices.",
    },
    {
      question: "Is there a file size limit?",
      answer:
        "Individual files can be up to 2GB in size. For larger files, we recommend splitting them into smaller parts or compressing them.",
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const { ref: featuresRef, inView: featuresInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section
        id="home"
        className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden"
      >
        <ParticleBackground />

        {/* Floating subtle orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float opacity-30" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float opacity-30" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-float opacity-20" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 max-w-6xl">
          {/* Badge */}
          <motion.div
            className="inline-block mb-8 px-6 py-3 glass-card text-white text-sm font-semibold border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ✨ Powered by Telegram Infrastructure
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 text-gradient font-display leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Unlimited Free
            <br />
            Cloud Storage
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Store, manage, and access your files anywhere with the power of
            Telegram&#39;s infrastructure. No limits, no fees, just pure storage.
          </motion.p>

          {/* Call-to-Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/register">
              <MagneticButton variant="primary">
                Get Started Free →
              </MagneticButton>
            </Link>
            <MagneticButton
              variant="secondary"
              onClick={() => scrollToSection("about")}
            >
              Learn More
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            ref={statsRef}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={statsInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {[
              { value: "∞", label: "Storage Space" },
              { value: "2GB", label: "Max File Size" },
              { value: "100%", label: "Free Forever" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass-card p-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section >

      {/* Features Section - Bento Grid */}
      < section ref={featuresRef} className="py-32 px-6 relative" >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient font-display">
              Why Choose Nimbus?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-body">
              Experience the next generation of cloud storage with features
              designed for modern users.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "☁️",
                title: "Unlimited Storage",
                desc: "Store as many files as you need without any storage limits or restrictions."
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                desc: "Your data is encrypted and stored securely with Telegram's infrastructure."
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Upload and download files at blazing speeds with optimized performance."
              },
              {
                icon: "📁",
                title: "All File Types",
                desc: "Support for images, videos, documents, archives, and more file formats."
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <GlassCard
                  className="p-8 h-full border border-white/10 group cursor-pointer"
                >
                  <motion.div
                    className="text-5xl mb-6"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 font-display">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-body">
                    {feature.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* About Section */}
      < section
        id="about"
        className="py-32 px-6 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gradient font-display">
                About Nimbus
              </h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed font-body">
                Nimbus is a revolutionary cloud storage solution that
                leverages the power of Telegram's infrastructure to provide you
                with unlimited, free storage for all your files.
              </p>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed font-body">
                We believe that cloud storage should be accessible to everyone,
                without hidden fees or storage limits. By integrating with
                Telegram, we&#39;re able to offer a secure, fast, and reliable
                storage solution that puts you in control of your data.
              </p>
              <div className="space-y-6">
                {[
                  {
                    title: "Built on Telegram's Infrastructure",
                    desc: "Leverage the reliability and security of Telegram's proven platform."
                  },
                  {
                    title: "Your Data, Your Control",
                    desc: "Files are stored in your personal Telegram space, giving you full ownership."
                  },
                  {
                    title: "Simple and Intuitive",
                    desc: "Easy-to-use interface designed for seamless file management."
                  }
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start space-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-black text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-lg font-display">{item.title}</h4>
                      <p className="text-gray-400 font-body">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-12 text-center border border-white/10">
                <motion.div
                  className="text-8xl mb-6"
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🚀
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 font-display">
                  Powered by Innovation
                </h3>
                <p className="text-gray-300 text-lg font-body">
                  Combining the best of cloud storage with Telegram's
                  technology
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section >

      {/* How It Works */}
      < section id="help" className="py-32 px-6" >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient font-display">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-body">
              Get started with Nimbus in just a few simple steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📝",
                title: "Create Account",
                desc: "Sign up with your email and create a secure password. It only takes a minute!",
                color: "blue"
              },
              {
                step: "2",
                icon: "🔗",
                title: "Connect Telegram",
                desc: "Link your Telegram account to enable secure file storage in your personal space.",
                color: "purple"
              },
              {
                step: "3",
                icon: "☁️",
                title: "Start Uploading",
                desc: "Upload your files and access them from anywhere, anytime. It&#39;s that simple!",
                color: "pink"
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-8 h-full border border-white/10">
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black text-2xl font-bold shadow-2xl">
                    {step.step}
                  </div>
                  <motion.div
                    className="text-6xl mb-6 mt-8"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring" }}
                  >
                    {step.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 font-display">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-body">
                    {step.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* FAQ Section */}
      < section
        id="faq"
        className="py-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400 font-body">
              Find answers to common questions about Nimbus.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <GlassCard className="overflow-hidden" hover={false}>
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold text-lg pr-4 font-display">
                      {faq.question}
                    </span>
                    <motion.span
                      className="text-3xl text-white"
                      animate={{ rotate: openFaqIndex === index ? 45 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      +
                    </motion.span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFaqIndex === index ? "auto" : 0,
                      opacity: openFaqIndex === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 text-gray-400 leading-relaxed font-body">
                      {faq.answer}
                    </div>
                  </motion.div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 mb-6 font-body">
              Still have questions?
            </p>
            <MagneticButton
              variant="primary"
              onClick={() => scrollToSection("contact")}
            >
              Contact Us
            </MagneticButton>
          </motion.div>
        </div>
      </section >

      {/* Contact Section */}
      < section id="contact" className="py-32 px-6" >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient font-display">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-body">
              Have a question or feedback? We&#39;d love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {[
                  { name: "name", label: "Name", type: "text", placeholder: "Your name" },
                  { name: "email", label: "Email", type: "email", placeholder: "your.email@example.com" },
                  { name: "subject", label: "Subject", type: "text", placeholder: "What is this about?" },
                ].map((field) => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-semibold mb-2 font-display"
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl glass-card border ${formErrors[field.name]
                        ? "border-red-500"
                        : "border-white/10"
                        } focus:outline-none focus:ring-2 focus:ring-aurora-blue transition-all bg-white/5 text-white placeholder-gray-500 font-body`}
                      placeholder={field.placeholder}
                    />
                    {formErrors[field.name] && (
                      <p className="text-red-400 text-sm mt-1">
                        {formErrors[field.name]}
                      </p>
                    )}
                  </div>
                ))}

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold mb-2 font-display"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl glass-card border ${formErrors.message
                      ? "border-red-500"
                      : "border-white/10"
                      } focus:outline-none focus:ring-2 focus:ring-aurora-blue transition-all resize-none bg-white/5 text-white placeholder-gray-500 font-body`}
                    placeholder="Your message..."
                  />
                  {formErrors.message && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.message}
                    </p>
                  )}
                </div>

                <MagneticButton variant="primary" className="w-full">
                  Send Message →
                </MagneticButton>
              </form>
            </GlassCard>

            {/* Contact Information */}
            <div className="space-y-6">
              {[
                {
                  icon: "📧",
                  title: "Email Us",
                  desc: "For general inquiries and support",
                  link: "contact.nimbuscloud@gmail.com"
                },
                {
                  icon: "💬",
                  title: "Join Community",
                  desc: "Connect with other users on Telegram",
                  link: "@nimbus_community"
                },
                {
                  icon: "🌐",
                  title: "Follow Us",
                  desc: "Stay updated on social media",
                  link: "Social Links"
                },
              ].map((contact, i) => (
                <motion.div
                  key={contact.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="p-8 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{contact.icon}</div>
                      <div>
                        <h3 className="font-bold text-xl mb-2 font-display">{contact.title}</h3>
                        <p className="text-gray-400 mb-3 font-body">{contact.desc}</p>
                        <a
                          href="#"
                          className="text-white hover:text-gray-300 transition-colors font-semibold"
                        >
                          {contact.link}
                        </a>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="glass-card border-t border-white/10 py-12 px-6" >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/nimbus-logo.png" alt="Nimbus Logo" width={36} height={36} className="object-contain" />
                <span className="text-2xl font-bold text-gradient font-display">
                  Nimbus
                </span>
              </div>
              <p className="text-gray-400 mt-3 max-w-sm font-body">
                Unlimited free cloud storage powered by Telegram. Store, manage,
                and access your files from anywhere.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 font-display">Quick Links</h4>
              <div className="space-y-2">
                {["About", "Help", "FAQ"].map((link) => (
                  <button
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase())}
                    className="block text-gray-400 hover:text-aurora-blue transition-colors font-body"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 font-display">Legal</h4>
              <div className="space-y-2">
                {["Privacy Policy", "Terms of Service"].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-gray-400 hover:text-aurora-blue transition-colors font-body"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 font-body">
              © {new Date().getFullYear()} Nimbus. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-400 hover:text-aurora-blue transition-colors font-body"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer >

      {/* Back to Top Button */}
      < motion.button
        onClick={() => scrollToSection("home")
        }
        className="fixed bottom-8 right-8 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-black text-2xl z-50"
        whileHover={{ scale: 1.1, rotate: 360 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        ↑
      </motion.button >
    </div >
  );
}
