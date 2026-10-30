"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    LuShieldCheck, 
    LuKey, 
    LuShare2, 
    LuSmartphone, 
    LuGlobe, 
    LuTrash2, 
    LuCopy, 
    LuCheck, 
    LuLock, 
    LuRadio,
    LuClock
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';

interface ActiveLinkItem {
    id: string;
    fileName: string;
    fileSize: string;
    url: string;
    permission: 'view_only' | 'full_access';
    expiresAt: string;
    viewsCount: number;
    createdAt: string;
}

interface ActiveSessionItem {
    id: string;
    device: string;
    browser: string;
    ip: string;
    location: string;
    isCurrent: boolean;
    lastActive: string;
}

export default function SecuritySettingsPage() {
    const params = useParams();
    const username = (params?.user as string) || "user";
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'links' | 'mfa' | 'sessions' | 'credentials'>('links');
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    // Active Links State
    const [activeLinks, setActiveLinks] = useState<ActiveLinkItem[]>([
        {
            id: 'lnk-01',
            fileName: 'CYBER_ARCHITECTURE_2026.pdf',
            fileSize: '42.8 MB',
            url: 'https://ciphervault.io/s/66fa19b0?token=k89a12c',
            permission: 'view_only',
            expiresAt: '18h 12m',
            viewsCount: 14,
            createdAt: '2026-10-28 09:15'
        },
        {
            id: 'lnk-02',
            fileName: 'QUANTUM_CIPHER_CORE.zip',
            fileSize: '1.2 GB',
            url: 'https://ciphervault.io/s/66fa22e1?token=p44b99x',
            permission: 'full_access',
            expiresAt: '5d 04h',
            viewsCount: 3,
            createdAt: '2026-10-27 18:30'
        },
        {
            id: 'lnk-03',
            fileName: 'AUDIT_METRICS_Q3.csv',
            fileSize: '8.4 MB',
            url: 'https://ciphervault.io/s/66fa77d8?token=r12v00m',
            permission: 'view_only',
            expiresAt: '2h 45m',
            viewsCount: 29,
            createdAt: '2026-10-28 14:02'
        }
    ]);

    // Active Sessions State
    const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([
        {
            id: 'sess-01',
            device: 'Desktop Workstation (Windows 11)',
            browser: 'Chrome 126.0 (Hardware-accelerated)',
            ip: '192.0.2.144',
            location: 'Mumbai, India',
            isCurrent: true,
            lastActive: 'Active Now'
        },
        {
            id: 'sess-02',
            device: 'Mobile Client (Telegram Bridge)',
            browser: 'Telegram Bot Interface v9.2',
            ip: '149.154.167.51',
            location: 'Frankfurt Datacenter, Germany',
            isCurrent: false,
            lastActive: '12m ago'
        },
        {
            id: 'sess-03',
            device: 'MacBook Pro (macOS Sonoma)',
            browser: 'Safari 17.4',
            ip: '198.51.100.82',
            location: 'Singapore Node',
            isCurrent: false,
            lastActive: 'Yesterday, 22:15'
        }
    ]);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mutationSuccess, setMutationSuccess] = useState(false);

    // Toggles
    const [telegramAlerts, setTelegramAlerts] = useState(true);
    const [autoRevokeExpired, setAutoRevokeExpired] = useState(true);
    const [biometricUnlock, setBiometricUnlock] = useState(false);

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const handleRevokeLink = (id: string) => {
        setActiveLinks(prev => prev.filter(l => l.id !== id));
    };

    const handleTerminateSession = (id: string) => {
        setActiveSessions(prev => prev.filter(s => s.id !== id));
    };

    const handleTerminateOtherSessions = () => {
        setActiveSessions(prev => prev.filter(s => s.isCurrent));
    };

    const handlePasswordMutation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || newPassword !== confirmPassword) return;
        setMutationSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setMutationSuccess(false), 4000);
    };

    return (
        <div className="min-h-screen bg-[#16181B] text-white pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-[#0720C6] text-white">
                                ACCESS CONTROL & SECURITY PROTOCOL
                            </span>
                            <span className="text-xs font-mono text-[#B8FE00] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B8FE00] animate-ping"></span>
                                CIPHER_LEVEL_5
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider text-white">
                            VAULT SECURITY SUITE
                        </h1>
                        <p className="text-sm font-sans text-neutral-400 mt-1 max-w-xl">
                            Enterprise cryptographic posture, zero-trust token dispatch, session authorization, and Telegram 2FA bridge management for <span className="text-white font-mono font-bold">@{username}</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3.5 py-2 bg-[#202327] border border-white/10 text-right">
                            <div className="text-[10px] font-mono text-white/50">VAULT DEFENSE SCORE</div>
                            <div className="text-xl font-display text-[#B8FE00]">99.8% OPTIMAL</div>
                        </div>
                    </div>
                </div>

                {/* 4 Telemetry Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="p-4 bg-[#202327] border border-white/10">
                        <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
                            <span>ZERO-KNOWLEDGE CIPHER</span>
                            <LuLock className="text-[#B8FE00]" />
                        </div>
                        <div className="text-xl font-display text-white">AES-256-GCM</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-1">End-to-end node encryption</div>
                    </div>

                    <div className="p-4 bg-[#202327] border border-white/10">
                        <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
                            <span>TELEGRAM 2FA BRIDGE</span>
                            <LuSmartphone className="text-blue-400" />
                        </div>
                        <div className="text-xl font-display text-white">CONNECTED</div>
                        <div className="text-[10px] font-mono text-[#B8FE00] mt-1">Direct bot authorization</div>
                    </div>

                    <div className="p-4 bg-[#202327] border border-white/10">
                        <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
                            <span>TOKENIZED LINKS</span>
                            <LuShare2 className="text-[#B8FE00]" />
                        </div>
                        <div className="text-xl font-display text-white">{activeLinks.length} ACTIVE</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-1">Expiring dispatch tokens</div>
                    </div>

                    <div className="p-4 bg-[#202327] border border-white/10">
                        <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
                            <span>AUTHORIZATION NODES</span>
                            <LuGlobe className="text-white" />
                        </div>
                        <div className="text-xl font-display text-white">{activeSessions.length} SESSIONS</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-1">All geographic endpoints</div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-white/10 overflow-x-auto gap-2">
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === 'links'
                                ? 'border-[#B8FE00] text-[#B8FE00]'
                                : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <LuShare2 size={14} />
                        <span>Shared Links ({activeLinks.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('mfa')}
                        className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === 'mfa'
                                ? 'border-[#B8FE00] text-[#B8FE00]'
                                : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <LuShieldCheck size={14} />
                        <span>MFA & Telegram Bridge</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === 'sessions'
                                ? 'border-[#B8FE00] text-[#B8FE00]'
                                : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <LuRadio size={14} />
                        <span>Active Sessions ({activeSessions.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('credentials')}
                        className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === 'credentials'
                                ? 'border-[#B8FE00] text-[#B8FE00]'
                                : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        <LuKey size={14} />
                        <span>Password & Key Rotation</span>
                    </button>
                </div>

                {/* Tab 1: Shared Links Management */}
                {activeTab === 'links' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-[#202327] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-display uppercase tracking-wider text-xl text-white">
                                    DISPATCHED LINK LEDGER
                                </h3>
                                <p className="text-xs font-sans text-neutral-400">
                                    Track, copy, inspect telemetry, or immediately de-authorize active shared links.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveLinks([])}
                                    disabled={activeLinks.length === 0}
                                    className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                                >
                                    REVOKE ALL LINKS
                                </button>
                            </div>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden space-y-3">
                            {activeLinks.map((link) => (
                                <div key={link.id} className="p-4 bg-[#202327] border border-white/10 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-bold text-white text-sm truncate" title={link.fileName}>
                                                {link.fileName}
                                            </div>
                                            <div className="text-[10px] font-mono text-white/40 mt-0.5">
                                                {link.fileSize} • {link.createdAt}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0 ${
                                            link.permission === 'view_only' 
                                                ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' 
                                                : 'bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30'
                                        }`}>
                                            {link.permission === 'view_only' ? 'STREAM' : 'FULL'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="truncate flex-1 text-xs text-white/80 bg-black/40 px-2.5 py-1.5 border border-white/10 font-mono">
                                            {link.url}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(link.id, link.url)}
                                            className="p-2 bg-[#16181B] hover:bg-[#B8FE00] hover:text-black text-white border border-white/15 transition-all shrink-0"
                                            title="Copy to clipboard"
                                        >
                                            {copiedLinkId === link.id ? <LuCheck size={14} className="text-[#B8FE00]" /> : <LuCopy size={14} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                                        <span className="text-white/60">Expires: {link.expiresAt}</span>
                                        <button
                                            onClick={() => handleRevokeLink(link.id)}
                                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-[10px] uppercase font-bold border border-red-500/30 transition-all flex items-center gap-1"
                                        >
                                            <LuTrash2 size={11} />
                                            <span>Revoke</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {activeLinks.length === 0 && (
                                <div className="p-8 text-center text-neutral-500 font-mono text-xs bg-[#202327] border border-white/10">
                                    ALL SHARED LINKS REVOKED OR NONE PROVISIONED
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block border border-white/10 bg-[#202327] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm font-sans">
                                    <thead className="bg-[#16181B] text-white/60 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
                                        <tr>
                                            <th className="py-3 px-4">ASSET & METRICS</th>
                                            <th className="py-3 px-4">ENCRYPTED URL</th>
                                            <th className="py-3 px-4">POLICY</th>
                                            <th className="py-3 px-4">EXPIRES IN</th>
                                            <th className="py-3 px-4">HITS</th>
                                            <th className="py-3 px-4 text-right">COMMAND</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-sans">
                                        {activeLinks.map((link) => (
                                            <tr key={link.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-white text-xs truncate max-w-xs" title={link.fileName}>
                                                        {link.fileName}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                                                        {link.fileSize} • {link.createdAt}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate max-w-[200px] text-white/80 bg-black/40 px-2 py-1 border border-white/10">
                                                            {link.url}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(link.id, link.url)}
                                                            className="p-1.5 bg-[#16181B] hover:bg-[#B8FE00] hover:text-black text-white border border-white/15 transition-all"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copiedLinkId === link.id ? <LuCheck size={12} className="text-[#B8FE00]" /> : <LuCopy size={12} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                                                        link.permission === 'view_only' 
                                                            ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' 
                                                            : 'bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30'
                                                    }`}>
                                                        {link.permission === 'view_only' ? 'STREAM ONLY' : 'FULL ACCESS'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs text-white/70">
                                                    {link.expiresAt}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs text-[#B8FE00] font-bold">
                                                    {link.viewsCount}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => handleRevokeLink(link.id)}
                                                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-mono text-[10px] uppercase font-bold border border-red-500/30 transition-all inline-flex items-center gap-1"
                                                    >
                                                        <LuTrash2 size={11} />
                                                        <span>Revoke</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {activeLinks.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono text-xs">
                                                    ALL SHARED LINKS REVOKED OR NONE PROVISIONED
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: MFA & Telegram Bridge */}
                {activeTab === 'mfa' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-[#202327] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-[#0720C6] text-white">
                                    OFFICIAL TELEGRAM BRIDGE
                                </span>
                                <span className="px-2 py-0.5 bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30 text-[10px] font-mono font-bold">
                                    ACTIVE
                                </span>
                            </div>

                            <h3 className="text-2xl font-display uppercase tracking-wider text-white">
                                TELEGRAM BOT SYNCHRONIZATION
                            </h3>

                            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                                CipherVault integrates directly with our dedicated Telegram Bot infrastructure to authenticate sessions, upload encrypted buffers via direct chat, and deliver instant compromise alerts.
                            </p>

                            <div className="p-4 bg-[#16181B] border border-white/10 font-mono text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-white/40">BOT HANDLE:</span>
                                    <span className="text-[#B8FE00]">@CipherVaultBot</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">LINKED IDENTITY:</span>
                                    <span className="text-white">tg://user?id=94821044</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">ENCRYPTION CHANNEL:</span>
                                    <span className="text-white">TLS 1.3 / MTProto v2.0</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center justify-between p-3 bg-[#16181B] border border-white/10 cursor-pointer">
                                    <div>
                                        <div className="text-xs font-mono font-bold text-white uppercase">INSTANT LOGIN ALERTS</div>
                                        <div className="text-[10px] text-white/50">Send Telegram push whenever a new device connects</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={telegramAlerts}
                                        onChange={(e) => setTelegramAlerts(e.target.checked)}
                                        className="accent-[#B8FE00] w-4 h-4 cursor-pointer"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-[#16181B] border border-white/10 cursor-pointer">
                                    <div>
                                        <div className="text-xs font-mono font-bold text-white uppercase">AUTO-PURGE EXPIRED TOKENS</div>
                                        <div className="text-[10px] text-white/50">Clean expired link hashes automatically every hour</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={autoRevokeExpired}
                                        onChange={(e) => setAutoRevokeExpired(e.target.checked)}
                                        className="accent-[#B8FE00] w-4 h-4 cursor-pointer"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Hardware Key & Biometrics */}
                        <div className="p-6 bg-[#202327] border border-white/10 space-y-4">
                            <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-[#16181B] border border-white/20 text-white">
                                FIDO2 / WEBAUTHN
                            </span>

                            <h3 className="text-2xl font-display uppercase tracking-wider text-white">
                                HARDWARE BIOMETRIC KEYS
                            </h3>

                            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                                Pair your device with biometric hardware security (Windows Hello, Apple Touch ID, or physical YubiKey) to enforce zero-friction local cryptographic unlocking.
                            </p>

                            <div className="p-4 bg-[#16181B] border border-dashed border-white/15 flex flex-col items-center justify-center text-center py-6">
                                <LuShieldCheck className="text-3xl text-[#B8FE00] mb-2" />
                                <div className="text-xs font-mono font-bold text-white uppercase">WEBAUTHN ENCLAVE READY</div>
                                <div className="text-[10px] text-white/40 mt-1 max-w-xs">
                                    Browser supports FIDO2 Level 3 cryptographic credentials.
                                </div>
                            </div>

                            <button
                                onClick={() => setBiometricUnlock(!biometricUnlock)}
                                className={`w-full py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                                    biometricUnlock 
                                        ? 'bg-[#B8FE00] text-black border-[#B8FE00] shadow-[0_0_15px_rgba(184,254,0,0.3)]' 
                                        : 'bg-[#16181B] text-white border-white/20 hover:border-white/40'
                                }`}
                            >
                                {biometricUnlock ? 'BIOMETRIC PASSKEY CONFIGURED' : '+ REGISTER DEVICE PASSKEY'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab 3: Active Sessions */}
                {activeTab === 'sessions' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-[#202327] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-display uppercase tracking-wider text-xl text-white">
                                    AUTHORIZED DEVICE SESSIONS
                                </h3>
                                <p className="text-xs font-sans text-neutral-400">
                                    Active authenticated cryptographic tokens granting access to your CipherVault storage vault.
                                </p>
                            </div>
                            <button
                                onClick={handleTerminateOtherSessions}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                            >
                                TERMINATE ALL OTHER SESSIONS
                            </button>
                        </div>

                        <div className="space-y-3">
                            {activeSessions.map((session) => (
                                <div key={session.id} className="p-4 bg-[#202327] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white">{session.device}</span>
                                            {session.isCurrent && (
                                                <span className="px-2 py-0.5 bg-[#B8FE00] text-black text-[9px] font-mono font-black uppercase">
                                                    THIS DEVICE
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs font-mono text-white/50">
                                            {session.browser} • {session.ip} ({session.location})
                                        </div>
                                        <div className="text-[10px] font-mono text-white/40">
                                            LAST TELEMETRY: <span className="text-[#B8FE00]">{session.lastActive}</span>
                                        </div>
                                    </div>

                                    {!session.isCurrent && (
                                        <button
                                            onClick={() => handleTerminateSession(session.id)}
                                            className="px-3 py-1.5 bg-[#16181B] hover:bg-red-600 hover:text-white text-red-400 border border-white/15 hover:border-red-500 text-xs font-mono uppercase tracking-wider transition-all self-start md:self-center"
                                        >
                                            TERMINATE
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 4: Password & Cipher Mutation */}
                {activeTab === 'credentials' && (
                    <div className="max-w-xl mx-auto p-6 md:p-8 bg-[#202327] border-2 border-white/10 space-y-6">
                        <div>
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30">
                                KEY ROTATION
                            </span>
                            <h2 className="text-3xl font-display uppercase tracking-wider text-white mt-2">
                                MUTATE VAULT PASSPHRASE
                            </h2>
                            <p className="text-xs text-neutral-400 mt-1 font-sans">
                                Updating your passphrase re-derives the master key using Argon2id with 64MB memory cost.
                            </p>
                        </div>

                        {mutationSuccess && (
                            <div className="p-3 bg-[#B8FE00]/10 border border-[#B8FE00]/40 text-[#B8FE00] font-mono text-xs flex items-center gap-2">
                                <LuCheck className="text-base" />
                                <span>PASSPHRASE MUTATION EXECUTED SUCCESSFULLY</span>
                            </div>
                        )}

                        <form onSubmit={handlePasswordMutation} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    CURRENT VAULT PASSPHRASE
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:border-[#B8FE00] focus:outline-none transition-colors"
                                    placeholder="••••••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    NEW HIGH-ENTROPY PASSPHRASE
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:border-[#B8FE00] focus:outline-none transition-colors"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    CONFIRM NEW PASSPHRASE
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:border-[#B8FE00] focus:outline-none transition-colors"
                                    placeholder="••••••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-[#B8FE00] hover:bg-white text-black font-mono font-bold uppercase text-xs tracking-wider transition-all border border-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.3)] mt-2"
                            >
                                ROTATE CIPHER KEYS & MUTATE
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}
