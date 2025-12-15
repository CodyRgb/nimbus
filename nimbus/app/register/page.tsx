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

    // UI State
    const [step, setStep] = useState<1 | 2>(1); // 1 = Details, 2 = Telegram

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "", // Keeping for state compatibility, though might not use in UI if 1 field
    });
    const [showPassword, setShowPassword] = useState(false);

    // Telegram State
    const [telegramStep, setTelegramStep] = useState<'PHONE' | 'CODE' | 'PASSWORD'>('PHONE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+1 (US)');
    const [code, setCode] = useState(['', '', '', '', '']); // Array for 5 digit inputs
    const [telegramPassword, setTelegramPassword] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [session, setSession] = useState('');

    // Status State
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            // Login immediately
            login({
                _id: res.data._id,
                name: res.data.name,
                email: res.data.email,
            }, res.data.token);

            setStep(2); // Move to Telegram step
        } catch (err: any) {
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Registration failed') : 'Registration failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Telegram handlers
    const handleSendCode = async () => {
        // Simple parsing of country code to get digits only if needed, 
        // but existing backend expectation depends on implementation.
        // Assuming we strip non-digits.
        const countryDigits = phoneCountryCode.replace(/\D/g, '');
        // Or if the value is like "+1 (US)", we might just want "+1".
        // Let's take the part before space
        const cc = phoneCountryCode.split(' ')[0];

        const fullPhone = `${cc}${phoneNumber}`.replace(/\s+/g, '');

        if (phoneNumber.length < 5) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/telegram/connect', { phoneNumber: fullPhone });
            setPhoneCodeHash(res.data.phoneCodeHash);
            setSession(res.data.session);
            setTelegramStep('CODE');
        } catch (err: any) {
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Failed to send code') : 'Failed to send code';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeInput = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(0, 1);
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value && index < 4) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerifyTelegram = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 5) {
            setError('Please enter the full 5-digit code');
            return;
        }

        setLoading(true);
        setError('');

        const cc = phoneCountryCode.split(' ')[0];
        const fullPhone = `${cc}${phoneNumber}`.replace(/\s+/g, '');

        try {
            await api.post('/telegram/verify', {
                phoneNumber: fullPhone,
                code: fullCode,
                phoneCodeHash,
                session,
                password: telegramPassword
            });
            // Success
            router.push("/login"); // Redirect to login or dashboard
        } catch (err: any) {
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
        <div className="h-screen w-full flex items-center justify-center pt-24 pb-8 px-4 md:px-8 bg-[#0b1121] text-white overflow-y-auto">
            <style jsx global>{`
                body {
                    background-color: #0b1121;
                }
                .green-gradient-panel {
                    background: linear-gradient(135deg, #0f2e18 0%, #051a0d 100%);
                    position: relative;
                    overflow: hidden;
                }
                .green-gradient-panel::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .input-dark {
                    background: #0b1121;
                    border: 1px solid #1e293b;
                    transition: all 0.2s ease;
                }
                .input-dark:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                /* Stepper Line */
                .step-line {
                    height: 2px;
                    background: #1e293b;
                    flex: 1;
                    margin: 0 1rem;
                    position: relative;
                }
                .step-line.active {
                   background: #22c55e;
                }
                .step-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                .step-circle.active {
                    background: #22c55e;
                    color: black;
                }
                .step-circle.inactive {
                    background: #1e293b;
                    color: #64748b;
                }
            `}</style>

            <div className="w-full max-w-6xl h-auto min-h-[600px] max-h-[calc(100vh-8rem)] bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel - Green Side */}
                <div className="md:w-5/12 green-gradient-panel p-10 flex flex-col justify-between relative">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold mb-8">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Secure Registration
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-white tracking-tight">
                            Create your<br />digital sanctuary.
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                            Join thousands of users who trust Nimbus for secure, encrypted, and ultra-fast cloud storage. Your data, your rules.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6 mt-12 md:mt-0">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500/20 group-hover:border-green-500/30 transition-all duration-300">
                                <span className="material-symbols-outlined text-green-500">lock</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5">End-to-End Encryption</h3>
                                <p className="text-gray-400 text-sm">Your files are encrypted before they leave your device.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all duration-300">
                                <span className="material-symbols-outlined text-purple-400">speed</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5">Lightning Fast Sync</h3>
                                <p className="text-gray-400 text-sm">Access your files instantly from any device, anywhere.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form Side */}
                <div className="md:w-7/12 bg-[#0b1121] p-8 md:p-16 flex flex-col relative">
                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-12 max-w-sm mx-auto w-full">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`step-circle ${step === 1 ? 'active' : 'bg-green-500 text-black'}`}>
                                {step > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                            </div>
                            <span className={`text-xs font-semibold ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>Account</span>
                        </div>

                        <div className="h-[2px] w-24 bg-[#1e293b] mx-4 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className={`step-circle ${step === 2 ? 'active' : 'inactive'}`}>
                                2
                            </div>
                            <span className={`text-xs font-semibold ${step === 2 ? 'text-white' : 'text-gray-500'}`}>Security</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 max-w-md mx-auto w-full">

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-3">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRegister} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Full Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-12"
                                            placeholder="Create a password"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {showPassword ? "visibility" : "visibility_off"}
                                            </span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-1">Must be at least 8 characters</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-4 w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    ) : (
                                        <>
                                            Create Account
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-sm text-gray-500 mt-2">
                                    Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Log in</Link>
                                </p>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-2">
                                    <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1e293b]">
                                        <span className="material-symbols-outlined text-blue-400 text-3xl">send</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Connect Telegram</h2>
                                    <p className="text-gray-400 text-sm">Enable 2FA via Telegram for enhanced security</p>
                                </div>

                                {telegramStep === 'PHONE' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-400 ml-1">Phone Number</label>
                                            <div className="flex gap-3">
                                                <div className="w-[120px] shrink-0">
                                                    <select
                                                        value={phoneCountryCode}
                                                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                                                        className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                            backgroundPosition: `right 0.5rem center`,
                                                            backgroundRepeat: `no-repeat`,
                                                            backgroundSize: `1.5em 1.5em`
                                                        }}
                                                    >
                                                        <option>+1 (US)</option>
                                                        <option>+44 (UK)</option>
                                                        <option>+91 (IN)</option>
                                                        <option>+61 (AU)</option>
                                                        <option>+81 (JP)</option>
                                                        <option>+49 (DE)</option>
                                                    </select>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                                    placeholder="555-0123"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                                            <span className="material-symbols-outlined text-blue-400 shrink-0">security</span>
                                            <p className="text-xs text-blue-200 leading-relaxed">
                                                We'll send a verification code to your Telegram account. If you have 2FA enabled on Telegram, you may need your password.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={loading}
                                            className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                        >
                                            {loading ? 'Sending...' : 'Get Code'}
                                        </button>
                                    </>
                                )}

                                {telegramStep === 'CODE' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-400 block mb-3 text-center">Enter the code sent to Telegram</label>
                                            <div className="flex justify-center gap-2">
                                                {code.map((digit, idx) => (
                                                    <input
                                                        key={idx}
                                                        id={`code-${idx}`}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleCodeInput(idx, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                                        className="w-12 h-14 bg-[#0f172a] border border-[#1e293b] rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleVerifyTelegram}
                                            disabled={loading}
                                            className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                        >
                                            {loading ? 'Verifying...' : 'Connect & Finish'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setTelegramStep('PHONE')}
                                            className="w-full text-sm text-gray-500 hover:text-white transition-colors"
                                        >
                                            Change Number?
                                        </button>
                                    </div>
                                )}

                                {telegramStep === 'PASSWORD' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-400 ml-1">2FA Password</label>
                                            <input
                                                type="password"
                                                value={telegramPassword}
                                                onChange={(e) => setTelegramPassword(e.target.value)}
                                                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Enter cloud password"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleVerifyTelegram}
                                            disabled={loading}
                                            className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                        >
                                            {loading ? 'Verifying...' : 'Connect & Finish'}
                                        </button>
                                    </div>
                                )}

                                {telegramStep === 'PHONE' && step === 2 && (
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={skipTelegram}
                                            className="text-gray-500 hover:text-white text-sm transition-colors mt-2"
                                        >
                                            Skip for now &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <Link href="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Homepage
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
