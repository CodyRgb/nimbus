"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import api from "../../lib/api";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    // State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Password Recovery Modal
    const [forgotModalOpen, setForgotModalOpen] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoverySent, setRecoverySent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/auth/login", {
                email,
                password,
            });

            login({
                _id: res.data._id,
                name: res.data.name,
                email: res.data.email,
            }, res.data.token);

            router.push(`/${res.data.name}/storage`);
        } catch (err: unknown) {
            let errorMessage = "Authentication failed. Please verify your credentials.";
            if (typeof err === "object" && err !== null && "response" in err) {
                const response = (err as { response: { data?: { message?: string } } }).response;
                if (response?.data?.message) {
                    errorMessage = response.data.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = (e: React.FormEvent) => {
        e.preventDefault();
        if (recoveryEmail) {
            setRecoverySent(true);
            setTimeout(() => {
                setRecoverySent(false);
                setForgotModalOpen(false);
                setRecoveryEmail("");
            }, 3000);
        }
    };

    return (
        <div className="bg-[#16181B] min-h-screen flex flex-col justify-center items-center px-4 py-28 relative overflow-hidden font-body text-white selection:bg-[#B8FE00] selection:text-[#16181B]">
            {/* Subtle background overlay */}
            <div className="absolute inset-0 hero-grid-pattern opacity-40 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[480px]">
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-[#B8FE00] text-2xl">✦</span>
                    <span className="font-display font-extrabold text-3xl tracking-wider uppercase text-white">
                        CIPHERVAULT
                    </span>
                </div>

                {/* Login Card */}
                <div className="bg-[#202327] border-2 border-white/15 rounded-2xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative">
                    <div className="flex flex-col gap-2 text-center mb-8">
                        <span className="eyebrow-tag justify-center text-xs">
                          ✦ SECURE AUTHENTICATION GATEWAY
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl uppercase text-white tracking-tight">
                            UNLOCK YOUR VAULT
                        </h1>
                        <p className="text-[#A0A6B2] text-xs font-mono">
                            Enter credentials to decrypt your sovereign cloud storage session.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl text-red-300 text-xs font-mono flex items-center gap-3">
                            <span className="text-red-400 text-base font-bold">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                EMAIL IDENTIFIER
                            </label>
                            <input
                                className="w-full h-12 px-5 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00] transition-colors"
                                placeholder="name@domain.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-mono uppercase tracking-wider text-[#A0A6B2]">
                                    PASSPHRASE
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setForgotModalOpen(true)}
                                    className="text-[11px] font-mono text-[#B8FE00] hover:underline"
                                >
                                    FORGOT PASSWORD?
                                </button>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    className="w-full h-12 px-5 pr-12 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FE00] transition-colors"
                                    placeholder="••••••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-[#A0A6B2] hover:text-white transition-colors cursor-pointer text-xs font-mono"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/30 bg-[#16181B] text-[#B8FE00] focus:ring-0 cursor-pointer"
                                    defaultChecked
                                />
                                <span className="text-xs font-mono text-[#A0A6B2]">
                                    Remember terminal session
                                </span>
                            </label>
                            <span className="text-[10px] font-mono text-[#B8FE00] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B8FE00]"></span>
                                AES-256
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 w-full h-13 bg-[#B8FE00] text-[#16181B] font-display text-sm tracking-wider uppercase font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(184,254,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 font-mono text-xs">
                                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    DECRYPTING SESSION...
                                </span>
                            ) : (
                                <>
                                    <span>UNLOCK CLOUD VAULT</span>
                                    <span>↗</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs font-mono text-[#A0A6B2]">
                        Don&apos;t have an encrypted vault yet?{" "}
                        <Link href="/register" className="text-[#B8FE00] font-bold hover:underline ml-1">
                            CREATE ACCOUNT ↗
                        </Link>
                    </div>
                </div>

                {/* Bottom Sovereign Note */}
                <p className="mt-6 text-center text-[11px] font-mono text-[#5A6065]">
                  ✦ Client-side zero-knowledge encrypted session. No plaintext keys stored.
                </p>
            </div>

            {/* Password Recovery Modal */}
            {forgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#202327] border-2 border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
                        <button
                            onClick={() => setForgotModalOpen(false)}
                            className="absolute top-4 right-4 text-[#A0A6B2] hover:text-white font-mono text-sm"
                        >
                            ✕
                        </button>
                        <div className="eyebrow-tag text-xs mb-2">✦ RECOVERY DISPATCH</div>
                        <h2 className="font-display text-2xl uppercase text-white mb-2">
                            RESET VAULT CREDENTIALS
                        </h2>
                        <p className="text-xs font-mono text-[#A0A6B2] mb-6">
                            Enter the email address registered with your vault. We will transmit emergency recovery instructions.
                        </p>

                        {recoverySent ? (
                            <div className="p-4 bg-[#B8FE00]/10 border border-[#B8FE00] rounded-xl text-[#B8FE00] text-xs font-mono flex items-center gap-2">
                                <span>✓</span>
                                <span>Recovery dispatch transmitted. Please verify your inbox.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleRecovery} className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    placeholder="user@domain.com"
                                    required
                                    className="w-full h-12 px-4 bg-[#16181B] border border-white/20 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#B8FE00]"
                                />
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setForgotModalOpen(false)}
                                        className="px-5 py-2.5 text-xs font-display uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-[#B8FE00] text-[#16181B] font-display text-xs uppercase tracking-wider font-bold rounded-full hover:bg-white transition-colors"
                                    >
                                        SEND RECOVERY ↗
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
