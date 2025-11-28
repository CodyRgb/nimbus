"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../../lib/api";
import { motion } from "framer-motion";
import GlassCard from "../components/ui/GlassCard";
import MagneticButton from "../components/ui/MagneticButton";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        <div className="min-h-screen flex items-center justify-center pt-32 bg-gradient-to-br from-deep-space-start via-deep-space-end to-deep-space-start relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-aurora-purple/30 rounded-full blur-3xl opacity-50 animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-aurora-blue/30 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-aurora-pink/20 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: "4s" }} />

            <motion.div
                className="relative w-full max-w-md p-8 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <GlassCard className="p-10 glow-purple">
                    <div className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="inline-block mb-4"
                        >
                            <div className="w-20 h-20 bg-gradient-aurora rounded-2xl flex items-center justify-center text-4xl shadow-2xl">
                                👋
                            </div>
                        </motion.div>
                        <h1 className="text-4xl font-bold text-gradient mb-2 font-display">
                            Welcome Back
                        </h1>
                        <p className="text-gray-400 font-body">Sign in to your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center font-body"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-300 mb-2 font-display"
                            >
                                Email Address
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue focus:border-transparent outline-none text-white placeholder-gray-500 transition-all bg-white/5 font-body"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-300 mb-2 font-display"
                            >
                                Password
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue focus:border-transparent outline-none text-white placeholder-gray-500 transition-all bg-white/5 font-body"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-400 cursor-pointer hover:text-gray-300 group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-aurora-purple focus:ring-aurora-purple/50 mr-2"
                                />
                                <span className="font-body">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-aurora-blue hover:text-aurora-pink transition-colors font-body"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-8 py-4 bg-gradient-to-r from-aurora-purple to-aurora-blue hover:from-aurora-blue hover:to-aurora-pink text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-lg glow-purple"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In →"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-gray-400 text-sm font-body">
                        Don&rsquo;t have an account?{" "}
                        <Link
                            href="/register"
                            className="text-aurora-blue hover:text-aurora-pink font-medium transition-colors"
                        >
                            Sign up
                        </Link>
                    </div>
                </GlassCard>

                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-aurora-blue rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
