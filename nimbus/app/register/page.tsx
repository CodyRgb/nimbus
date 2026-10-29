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
        confirmPassword: "",
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
        } catch (err: unknown) {
            let message = "Registration failed";
            if (isAxiosError(err)) {
                message = err.response?.data?.message || 'Registration failed';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Telegram handlers
    const handleSendCode = async () => {
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
        } catch (err: unknown) {
            let message = "Failed to send verification code";
            if (isAxiosError(err)) {
                message = err.response?.data?.message || 'Failed to send code';
            }
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
            router.push(`/${formData.name || 'user'}/storage`);
        } catch (err: unknown) {
            let msg = "Verification failed";
            if (isAxiosError(err)) {
                msg = err.response?.data?.message || 'Verification failed';
            }
            if (msg.includes('password') || msg.includes('SESSION_PASSWORD_NEEDED')) {
                setTelegramStep('PASSWORD');
                setError('Two-step verification password required');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const skipTelegram = () => {
        router.push(`/${formData.name || 'user'}/storage`);
    };

    return (
        <div className="bg-[#16181B] min-h-screen flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-white font-body selection:bg-[#B8FE00] selection:text-[#16181B] relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 hero-grid-pattern opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-5xl bg-[#202327] border-2 border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col md:flex-row relative z-10">
                {/* Left Panel: High Impact Royal Blue Branding */}
                <div className="md:w-5/12 bg-[#0720C6] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8FE00] text-[#16181B] text-xs font-display tracking-wider uppercase font-bold mb-6">
                            <span>✦</span>
                            <span>ZERO SUBSCRIPTIONS</span>
                        </div>

                        <h1 className="font-display text-4xl sm:text-5xl uppercase leading-[0.92] tracking-tight mb-4">
                            INITIALIZE <br />
                            <span className="text-[#B8FE00]">SOVEREIGN VAULT</span>
                        </h1>
                        <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                            Join over 10,000+ engineers, researchers, and creators holding their encrypted assets without storage limits.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4 my-8">
                        <div className="flex items-center gap-3.5 p-3.5 bg-black/20 border border-white/15 rounded-xl">
                            <span className="text-[#B8FE00] text-xl">✦</span>
                            <div>
                                <h3 className="font-display text-sm tracking-wider uppercase text-white">
                                    CLIENT-SIDE AES-256 GCM
                                </h3>
                                <p className="text-white/70 text-xs">Keys generated and kept exclusively in your browser.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 p-3.5 bg-black/20 border border-white/15 rounded-xl">
                            <span className="text-[#B8FE00] text-xl">✦</span>
                            <div>
                                <h3 className="font-display text-sm tracking-wider uppercase text-white">
                                    TELEGRAM MTPROTO MESH
                                </h3>
                                <p className="text-white/70 text-xs">Infinite distributed persistence with zero recurring fees.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/20 font-mono text-xs text-white/70 flex items-center justify-between">
                        <span>Vault Spec:</span>
                        <span className="text-[#B8FE00] font-bold">2GB/File • Unlimited Space</span>
                    </div>
                </div>

                {/* Right Panel: Stepper & Forms */}
                <div className="md:w-7/12 p-8 sm:p-12 flex flex-col justify-between">
                    <div>
                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-between max-w-xs mx-auto mb-10 pb-6 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-xs ${step === 1 ? 'bg-[#B8FE00] text-[#16181B] font-bold' : 'bg-[#0720C6] text-white'}`}>
                                    01
                                </span>
                                <span className="text-xs font-display tracking-wider uppercase text-white">
                                    CREDENTIALS
                                </span>
                            </div>
                            <span className="text-white/30 font-mono">———</span>
                            <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-xs ${step === 2 ? 'bg-[#B8FE00] text-[#16181B] font-bold' : 'bg-[#16181B] text-[#A0A6B2] border border-white/20'}`}>
                                    02
                                </span>
                                <span className={`text-xs font-display tracking-wider uppercase ${step === 2 ? 'text-white' : 'text-[#A0A6B2]'}`}>
                                    TELEGRAM
                                </span>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono flex items-center gap-3">
                                <span className="text-red-400 font-bold">⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                        FULL NAME OR ALIAS
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00] transition-colors"
                                        placeholder="Alex Vance"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                        EMAIL IDENTIFIER
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00] transition-colors"
                                        placeholder="alex@domain.com"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                            VAULT MASTER PASSWORD
                                        </label>
                                        <span className="text-[10px] font-mono text-[#A0A6B2]">Min 8 Characters</span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full h-12 px-4 pr-12 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00] transition-colors"
                                            placeholder="••••••••••••"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 text-xs font-mono text-[#A0A6B2] hover:text-white"
                                        >
                                            {showPassword ? "HIDE" : "SHOW"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-4 w-full h-13 bg-[#B8FE00] text-[#16181B] font-display text-sm tracking-wider uppercase font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(184,254,0,0.3)] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <span className="font-mono text-xs flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                            INITIALIZING...
                                        </span>
                                    ) : (
                                        <>
                                            <span>CONTINUE TO TELEGRAM SETUP</span>
                                            <span>↗</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <div className="text-center mb-2">
                                    <div className="w-12 h-12 rounded-full bg-[#0720C6] text-[#B8FE00] flex items-center justify-center mx-auto mb-3 font-display text-xl">
                                        ✦
                                    </div>
                                    <h2 className="font-display text-2xl uppercase text-white">
                                        CONNECT TELEGRAM BOT
                                    </h2>
                                    <p className="text-xs font-mono text-[#A0A6B2]">
                                        Links your storage space directly to Telegram for infinite backups.
                                    </p>
                                </div>

                                {telegramStep === 'PHONE' && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                                PHONE NUMBER (WITH COUNTRY CODE)
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={phoneCountryCode}
                                                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                                                    className="w-[110px] h-12 bg-[#16181B] border border-white/20 rounded-xl px-3 font-mono text-xs text-white focus:outline-none focus:border-[#B8FE00]"
                                                >
                                                    <option>+1 (US)</option>
                                                    <option>+44 (UK)</option>
                                                    <option>+91 (IN)</option>
                                                    <option>+61 (AU)</option>
                                                    <option>+81 (JP)</option>
                                                    <option>+49 (DE)</option>
                                                    <option>+33 (FR)</option>
                                                </select>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="9876543210"
                                                    className="flex-1 h-12 px-4 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00]"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={loading}
                                            className="w-full h-12 bg-[#B8FE00] text-[#16181B] font-display text-xs tracking-wider uppercase font-bold rounded-xl hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {loading ? "TRANSMITTING CODE..." : "SEND TELEGRAM CODE ↗"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={skipTelegram}
                                            className="text-center font-mono text-xs text-[#A0A6B2] hover:text-white transition-colors"
                                        >
                                            Skip for now &amp; proceed to Dashboard →
                                        </button>
                                    </>
                                )}

                                {telegramStep === 'CODE' && (
                                    <div className="space-y-4">
                                        <p className="text-xs font-mono text-center text-[#B8FE00]">
                                            Enter the 5-digit security code received in Telegram:
                                        </p>
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
                                                    className="w-12 h-14 bg-[#16181B] border-2 border-white/20 focus:border-[#B8FE00] rounded-xl text-center text-xl font-bold font-mono text-white focus:outline-none"
                                                />
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleVerifyTelegram}
                                            disabled={loading}
                                            className="w-full h-12 bg-[#B8FE00] text-[#16181B] font-display text-xs tracking-wider uppercase font-bold rounded-xl hover:bg-white transition-all cursor-pointer"
                                        >
                                            {loading ? "VERIFYING..." : "VERIFY & ENTER VAULT ↗"}
                                        </button>

                                        <div className="flex justify-between items-center text-xs font-mono">
                                            <button
                                                type="button"
                                                onClick={() => setTelegramStep('PHONE')}
                                                className="text-[#A0A6B2] hover:text-white"
                                            >
                                                Change Number?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={skipTelegram}
                                                className="text-[#A0A6B2] hover:text-white"
                                            >
                                                Skip →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {telegramStep === 'PASSWORD' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                                TELEGRAM 2FA CLOUD PASSWORD
                                            </label>
                                            <input
                                                type="password"
                                                value={telegramPassword}
                                                onChange={(e) => setTelegramPassword(e.target.value)}
                                                className="w-full h-12 px-4 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#B8FE00]"
                                                placeholder="Enter 2FA password"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleVerifyTelegram}
                                            disabled={loading}
                                            className="w-full h-12 bg-[#B8FE00] text-[#16181B] font-display text-xs tracking-wider uppercase font-bold rounded-xl hover:bg-white transition-all cursor-pointer"
                                        >
                                            {loading ? "AUTHENTICATING 2FA..." : "CONFIRM 2FA & ENTER ↗"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Link to Login */}
                    <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs font-mono text-[#A0A6B2]">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#B8FE00] font-bold hover:underline ml-1">
                            LOG IN HERE ↗
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
