"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { isAxiosError } from "axios";
import api from "../../lib/api";

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
        <div className="min-h-screen flex items-center justify-center pt-32 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/30 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />

            <div className="relative w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-10">
                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 'REGISTER' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'}`}>
                            {registrationComplete ? '✓' : '1'}
                        </div>
                        <div className="w-12 h-0.5 bg-white/20"></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 'TELEGRAM' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                            2
                        </div>
                    </div>
                </div>

                {step === 'REGISTER' ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Create Account
                            </h1>
                            <p className="text-gray-400 mt-2">Join us today</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-300 mb-2"
                                >
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-300 mb-2"
                                >
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-300 mb-2"
                                >
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-300 mb-2"
                                >
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creating Account...' : 'Continue'}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-gray-400 text-sm">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Connect Telegram Storage
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">
                                Connect your Telegram account to store files in your Saved Messages
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Phone Number Step */}
                        {telegramStep === 'PHONE' && (
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+1234567890"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1...)</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg shadow-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </form>
                        )}

                        {/* Verification Code Step */}
                        {telegramStep === 'CODE' && (
                            <form onSubmit={handleVerifyTelegram} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter the code sent to your Telegram</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Connect'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTelegramStep('PHONE')}
                                    className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Change Phone Number
                                </button>
                            </form>
                        )}

                        {/* 2FA Password Step */}
                        {telegramStep === 'PASSWORD' && (
                            <form onSubmit={handleVerifyTelegram} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Two-Step Verification Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter your 2FA password"
                                        value={telegramPassword}
                                        onChange={(e) => setTelegramPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Verifying...' : 'Verify Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTelegramStep('CODE')}
                                    className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Back to Code
                                </button>
                            </form>
                        )}

                        {/* Skip Button */}
                        <div className="mt-6">
                            <button
                                onClick={skipTelegram}
                                className="w-full py-2.5 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                            >
                                Skip for Now
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                You can connect Telegram later from your dashboard
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
