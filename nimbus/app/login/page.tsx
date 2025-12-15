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

            router.push(`/${res.data.name}/upload`);
        } catch (err: unknown) {
            let errorMessage = "Login failed";
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

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-white overflow-hidden h-screen flex flex-col">
            {/* Header */}


            {/* Main Content */}
            <main className="relative flex-1 flex items-center justify-center p-4 overflow-y-auto">
                <div className="glow-orb orb-1"></div>
                <div className="glow-orb orb-2"></div>

                <div className="relative z-10 w-full max-w-[480px]">
                    <div className="glass-card bg-glass-gradient border border-white/10 rounded-xl p-8 md:p-12 flex flex-col gap-8">
                        <div className="flex flex-col gap-2 text-center">
                            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Welcome back</h1>
                            <p className="text-accent-text text-base font-normal">Enter your credentials to access your cloud vault.</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl flex items-center gap-3">
                                <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium leading-normal ml-1">Email Address</span>
                                <input
                                    className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-full text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-dark-border bg-dark-input focus:border-primary h-12 md:h-14 placeholder:text-accent-text/50 px-6 text-base font-normal leading-normal transition-all"
                                    placeholder="user@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium leading-normal ml-1">Password</span>
                                <div className="relative flex w-full items-center rounded-full bg-dark-input border border-dark-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/50 transition-all overflow-hidden h-12 md:h-14">
                                    <input
                                        className="form-input flex-1 w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-accent-text/50 px-6 h-full text-base font-normal leading-normal"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        className="px-4 text-accent-text hover:text-primary transition-colors flex items-center justify-center h-full cursor-pointer"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? "visibility" : "visibility_off"}
                                        </span>
                                    </button>
                                </div>
                            </label>

                            <div className="flex items-center justify-between checkbox-container">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            className="peer h-5 w-5 rounded border-dark-border border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none transition-all cursor-pointer"
                                            type="checkbox"
                                        />
                                    </div>
                                    <span className="text-accent-text group-hover:text-white text-sm font-medium transition-colors select-none">Remember me</span>
                                </label>
                                <a className="text-sm font-bold text-accent-text hover:text-primary transition-colors" href="#">Forgot password?</a>
                            </div>

                            <button
                                className="mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 md:h-14 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Logging In...
                                    </span>
                                ) : (
                                    <span className="truncate">Log In</span>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-accent-text text-sm">
                                Don't have an account?
                                <Link className="font-bold text-white hover:text-primary transition-colors ml-1" href="/register">Sign Up</Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[300px] opacity-10 pointer-events-none z-0" style={{
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2qiV64FJOs7KTs2sQAvlzxEjkH48xTjKjMk4DDaF9iFNrqo0xoca31oAGFf4uNIWOM1m8veeHmpgspOEVrzHFXZcsH2LQ4BX7UateBrJIrqcyfDCMbL2fhQiCMv0yqQLvxdV85G8s63Ehnx34OhhgHimTuF7zc_qRWSdUujys1e5pZ6MZdRVCtaMg58scxMcOObj36j03NIN2iaeNlT21CBl6fXG_kRzmWKtLKFnOJPHl-ifEoC4auFQN6BQKT9j_W46BZ8CXS-Y')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    maskImage: 'linear-gradient(to top, black, transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, black, transparent)'
                }}>
                    <span className="sr-only" data-alt="Abstract network lines representing global connectivity"></span>
                </div>
            </main>
        </div>
    );
}
