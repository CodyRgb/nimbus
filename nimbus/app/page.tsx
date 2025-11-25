"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

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
    // Clear error when user starts typing
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
    // Handle form submission (e.g., send to API)
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
        "Absolutely! Your files are stored using Telegram's secure infrastructure with end-to-end encryption. We take your privacy seriously and never access your files without permission.",
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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
      {/* Navigation Menu */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/nimbus-logo.png" alt="Nimbus Logo" width={40} height={40} className="object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Nimbus
              </span>
            </Link>
            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection("hero")}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("help")}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Help
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </button>
            </div>
            <Link
              href="/login"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950"
      >
        <div className="max-w-5xl">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-semibold">
            ✨ Powered by Telegram
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Unlimited Free Cloud Storage
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Store, manage, and access your files anywhere with the power of
            Telegram's infrastructure. No limits, no fees, just pure storage.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <button
              onClick={() => scrollToSection("about")}
              className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                ∞
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Storage Space
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                2GB
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Max File Size
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                100%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Free Forever
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Why Choose Us?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
            Experience the next generation of cloud storage with features
            designed for modern users.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 text-white text-3xl group-hover:scale-110 transition-transform">
                ☁️
              </div>
              <h3 className="text-xl font-bold mb-2">Unlimited Storage</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Store as many files as you need without any storage limits or
                restrictions.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 text-white text-3xl group-hover:scale-110 transition-transform">
                🔒
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is encrypted and stored securely with Telegram's
                infrastructure.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white text-3xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and download files at blazing speeds with optimized
                performance.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 text-white text-3xl group-hover:scale-110 transition-transform">
                📁
              </div>
              <h3 className="text-xl font-bold mb-2">All File Types</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Support for images, videos, documents, archives, and more file
                formats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                About Nimbus
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Nimbus is a revolutionary cloud storage solution that
                leverages the power of Telegram's infrastructure to provide you
                with unlimited, free storage for all your files.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We believe that cloud storage should be accessible to everyone,
                without hidden fees or storage limits. By integrating with
                Telegram, we're able to offer a secure, fast, and reliable
                storage solution that puts you in control of your data.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Built on Telegram's Infrastructure
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Leverage the reliability and security of Telegram's
                      proven platform.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Your Data, Your Control
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Files are stored in your personal Telegram space, giving
                      you full ownership.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Simple and Intuitive
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Easy-to-use interface designed for seamless file
                      management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-2xl font-bold mb-2">
                    Powered by Innovation
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Combining the best of cloud storage with Telegram's
                    technology
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section id="help" className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
            Get started with Nimbus in just a few simple steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  1
                </div>
                <div className="text-4xl mb-4 mt-4">📝</div>
                <h3 className="text-xl font-bold mb-3">Create Account</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sign up with your email and create a secure password. It only
                  takes a minute!
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>Quick registration process</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>No credit card required</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  2
                </div>
                <div className="text-4xl mb-4 mt-4">🔗</div>
                <h3 className="text-xl font-bold mb-3">Connect Telegram</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Link your Telegram account to enable secure file storage in
                  your personal space.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-600">•</span>
                    <span>Secure OTP verification</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-600">•</span>
                    <span>One-time setup</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  3
                </div>
                <div className="text-4xl mb-4 mt-4">☁️</div>
                <h3 className="text-xl font-bold mb-3">Start Uploading</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload your files and access them from anywhere, anytime.
                  It's that simple!
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Drag and drop interface</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Multiple file uploads</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Help Resources */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Need More Help?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xl">
                  📚
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Documentation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive guides and tutorials to help you get the most
                    out of Nimbus.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xl">
                  💬
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Community Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Join our community forum to ask questions and share tips
                    with other users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-20 px-6 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-gray-900"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16">
            Find answers to common questions about Nimbus.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-semibold text-lg pr-4">
                    {faq.question}
                  </span>
                  <span
                    className={`text-2xl text-blue-600 dark:text-blue-400 transform transition-transform ${openFaqIndex === index ? "rotate-45" : ""
                      }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${openFaqIndex === index ? "max-h-96" : "max-h-0"
                    }`}
                >
                  <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions?
            </p>
            <button
              onClick={() => scrollToSection("contact")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Get In Touch
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
            Have a question or feedback? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                      } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="Your name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.email
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                      } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.subject
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                      } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="What is this about?"
                  />
                  {formErrors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.message
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                      } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`}
                    placeholder="Your message..."
                  />
                  {formErrors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-2xl">
                    📧
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Email Us</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      For general inquiries and support
                    </p>
                    <a
                      href="mailto:support@nimbus.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      support@nimbus.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-2xl">
                    💬
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Join Community</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Connect with other users on Telegram
                    </p>
                    <a
                      href="#"
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      @nimbus_community
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-2xl">
                    🌐
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Follow Us</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Stay updated on social media
                    </p>
                    <div className="flex space-x-4">
                      <a
                        href="#"
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Twitter
                      </a>
                      <a
                        href="#"
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        LinkedIn
                      </a>
                      <a
                        href="#"
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/nimbus-logo.png" alt="Nimbus Logo" width={36} height={36} className="object-contain" />
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Nimbus
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3 max-w-sm">
                Unlimited free cloud storage powered by Telegram. Store, manage,
                and access your files from anywhere.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button
                  onClick={() => scrollToSection("about")}
                  className="block text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("help")}
                  className="block text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Help
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="block text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  FAQ
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="block text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="block text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Nimbus. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-700 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button
        onClick={() => scrollToSection("hero")}
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
