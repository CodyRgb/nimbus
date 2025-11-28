"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { isAxiosError } from "axios";
import api from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/ui/GlassCard";
import MagneticButton from "../components/ui/MagneticButton";

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [step, setStep] = useState<'REGISTER' | 'TELEGRAM'>('REGISTER');
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [registrationComplete, setRegistrationComplete] = useState(false);

    // Telegram connection state
    const [telegramStep, setTelegramStep] = useState<'PHONE' | 'CODE' | 'PASSWORD'>('PHONE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [telegramPassword, setTelegramPassword] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [session, setSession] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            // Use auth context login function
            login({
                _id: res.data._id,
                name: res.data.name,
                email: res.data.email,
            }, res.data.token);

            setRegistrationComplete(true);
            setStep('TELEGRAM');
        } catch (err) {
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Registration failed') : 'Registration failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Telegram connection handlers
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/telegram/connect', { phoneNumber });
            setPhoneCodeHash(res.data.phoneCodeHash);
            setSession(res.data.session);
            setTelegramStep('CODE');
        } catch (err) {
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Failed to send code') : 'Failed to send code';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTelegram = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/telegram/verify', {
                phoneNumber,
                code,
                phoneCodeHash,
                session,
                password: telegramPassword
            });
            // Success! Redirect to dashboard
            router.push("/login");
        } catch (err) {
            const msg = isAxiosError(err) ? (err.response?.data?.message || 'Verification failed') : 'Verification failed';
            if (msg.includes('password') || msg.includes('SESSION_PASSWORD_NEEDED')) {
                setTelegramStep('PASSWORD');
                setError('Two-step verification required');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const skipTelegram = () => {
        router.push("/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 bg-gradient-to-br from-deep-space-start via-deep-space-end to-deep-space-start relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-aurora-purple/20 rounded-full blur-[100px] opacity-50 animate-float" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-aurora-blue/20 rounded-full blur-[100px] opacity-50 animate-float" style={{ animationDelay: "2s" }} />

            <motion.div
                className="relative w-full max-w-md z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <GlassCard className="p-8 md:p-10 glow-blue border-white/10">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center space-x-4">
                            <motion.div
                                animate={{
                                    backgroundColor: step === 'REGISTER' ? 'var(--aurora-purple)' : 'var(--accent-success)',
                                    scale: step === 'REGISTER' ? 1.1 : 1
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20" />
                                {registrationComplete ? '✓' : '1'}
                            </motion.div>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-aurora-purple to-aurora-blue"
                                    initial={{ width: "0%" }}
                                    animate={{ width: step === 'TELEGRAM' ? "100%" : "0%" }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <motion.div
                                animate={{
                                    backgroundColor: step === 'TELEGRAM' ? 'var(--aurora-blue)' : 'rgba(255,255,255,0.1)',
                                    color: step === 'TELEGRAM' ? 'white' : 'rgba(255,255,255,0.4)',
                                    scale: step === 'TELEGRAM' ? 1.1 : 1
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 opacity-0 data-[active=true]:opacity-100" data-active={step === 'TELEGRAM'} />
                                2
                            </motion.div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'REGISTER' ? (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8 text-center">
                                    <h1 className="text-3xl font-bold text-gradient mb-3 font-display tracking-tight">
                                        Create Account
                                    </h1>
                                    <p className="text-gray-400 font-body">Join the future of storage today</p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3 font-body"
                                    >
                                        <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleRegister} className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 font-display ml-1">
                                            Full Name
                                        </label>
                                        <motion.input
                                            whileFocus={{ scale: 1.01 }}
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-purple/50 focus:border-aurora-purple/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 font-display ml-1">
                                            Email Address
                                        </label>
                                        <motion.input
                                            whileFocus={{ scale: 1.01 }}
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-purple/50 focus:border-aurora-purple/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 font-display ml-1">
                                                Password
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01 }}
                                                type="password"
                                                id="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-purple/50 focus:border-aurora-purple/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 font-display ml-1">
                                                Confirm
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01 }}
                                                type="password"
                                                id="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-purple/50 focus:border-aurora-purple/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <MagneticButton
                                        variant="primary"
                                        className="w-full !py-4 !text-lg !font-bold shadow-lg shadow-aurora-purple/20 mt-6"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Creating Account...
                                            </span>
                                        ) : (
                                            "Continue →"
                                        )}
                                    </MagneticButton>
                                </form>

                                <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-400 text-sm font-body">
                                    Already have an account?{" "}
                                    <Link
                                        href="/login"
                                        className="text-aurora-blue hover:text-aurora-pink font-semibold transition-colors inline-flex items-center gap-1 group"
                                    >
                                        Sign in
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="telegram"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-6 text-center">
                                    <div className="w-16 h-16 mx-auto bg-[#229ED9]/20 rounded-2xl flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold text-white mb-2 font-display">
                                        Connect Telegram
                                    </h1>
                                    <p className="text-gray-400 text-sm font-body">
                                        Store files securely in your Saved Messages
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3 font-body"
                                    >
                                        <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </motion.div>
                                )}

                                {/* Phone Number Step */}
                                {telegramStep === 'PHONE' && (
                                    <form onSubmit={handleSendCode} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300 font-display ml-1">
                                                Phone Number
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01 }}
                                                type="text"
                                                placeholder="+1234567890"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue/50 focus:border-aurora-blue/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 ml-1">Include country code (e.g., +1...)</p>
                                        </div>
                                        <MagneticButton
                                            variant="primary"
                                            className="w-full !py-3.5 !text-base shadow-lg shadow-aurora-blue/20"
                                        >
                                            {loading ? 'Sending...' : 'Send Verification Code'}
                                        </MagneticButton>
                                    </form>
                                )}

                                {/* Verification Code Step */}
                                {telegramStep === 'CODE' && (
                                    <form onSubmit={handleVerifyTelegram} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300 font-display ml-1">
                                                Verification Code
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01 }}
                                                type="text"
                                                placeholder="12345"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue/50 focus:border-aurora-blue/50 outline-none text-white placeholder-gray-500 transition-all font-body tracking-widest text-center text-lg"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 text-center">Enter the code sent to your Telegram app</p>
                                        </div>
                                        <MagneticButton
                                            variant="primary"
                                            className="w-full !py-3.5 !text-base shadow-lg shadow-aurora-blue/20"
                                        >
                                            {loading ? 'Verifying...' : 'Verify & Connect'}
                                        </MagneticButton>
                                        <button
                                            type="button"
                                            onClick={() => setTelegramStep('PHONE')}
                                            className="w-full text-sm text-aurora-blue hover:text-aurora-pink transition-colors"
                                        >
                                            Change Phone Number
                                        </button>
                                    </form>
                                )}

                                {/* 2FA Password Step */}
                                {telegramStep === 'PASSWORD' && (
                                    <form onSubmit={handleVerifyTelegram} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300 font-display ml-1">
                                                Two-Step Verification Password
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01 }}
                                                type="password"
                                                placeholder="Enter your 2FA password"
                                                value={telegramPassword}
                                                onChange={(e) => setTelegramPassword(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue/50 focus:border-aurora-blue/50 outline-none text-white placeholder-gray-500 transition-all font-body"
                                                required
                                            />
                                        </div>
                                        <MagneticButton
                                            variant="primary"
                                            className="w-full !py-3.5 !text-base shadow-lg shadow-aurora-blue/20"
                                        >
                                            {loading ? 'Verifying...' : 'Verify Password'}
                                        </MagneticButton>
                                        <button
                                            type="button"
                                            onClick={() => setTelegramStep('CODE')}
                                            className="w-full text-sm text-aurora-blue hover:text-aurora-pink transition-colors"
                                        >
                                            Back to Code
                                        </button>
                                    </form>
                                )}

                                {/* Skip Button */}
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <button
                                        onClick={skipTelegram}
                                        className="w-full py-3 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all hover:bg-white/5"
                                    >
                                        Skip for Now
                                    </button>
                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        You can connect Telegram later from your dashboard
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>

                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white/30 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -40, 0],
                                opacity: [0, 0.8, 0],
                                scale: [0, 1.5, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 4,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
