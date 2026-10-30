"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCopy, LuCheck, LuLock, LuGlobe, LuClock, LuShieldCheck, LuTrash2, LuShare2 } from 'react-icons/lu';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        _id: string;
        originalName: string;
        size: number;
        mimeType: string;
    } | null;
}

interface SharedLink {
    id: string;
    url: string;
    permission: 'view_only' | 'full_access';
    expiresAt: string;
    viewsCount: number;
    createdAt: string;
    hasPassword: boolean;
}

export default function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
    const [activeTab, setActiveTab] = useState<'create' | 'links'>('create');
    const [accessScope, setAccessScope] = useState<'view_only' | 'full_access'>('view_only');
    const [expiration, setExpiration] = useState<'1h' | '24h' | '7d' | 'never'>('24h');
    const [passwordProtected, setPasswordProtected] = useState(false);
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
    const [currentLink, setCurrentLink] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            // Generate deterministic mock public dispatch URL with encryption key token
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ciphervault.io';
            const randomToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            const generatedUrl = `${origin}/s/${file._id}?token=${randomToken}&scope=${accessScope}`;
            setCurrentLink(generatedUrl);
            setCopied(false);
            
            // Seed sample active links for demo
            setSharedLinks([
                {
                    id: 'lnk-01',
                    url: `${origin}/s/${file._id}?token=c8f92a10e4b7`,
                    permission: 'view_only',
                    expiresAt: '23h 42m remaining',
                    viewsCount: 4,
                    createdAt: 'Today, 14:20',
                    hasPassword: false,
                }
            ]);
        }
    }, [isOpen, file, accessScope]);

    const handleCopy = () => {
        if (!currentLink) return;
        navigator.clipboard.writeText(currentLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleRevoke = (linkId: string) => {
        setSharedLinks(prev => prev.filter(l => l.id !== linkId));
    };

    const handleCreateLink = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ciphervault.io';
        const randomToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        const newUrl = `${origin}/s/${file?._id}?token=${randomToken}&scope=${accessScope}`;
        
        const newEntry: SharedLink = {
            id: 'lnk-' + Date.now().toString().slice(-4),
            url: newUrl,
            permission: accessScope,
            expiresAt: expiration === '1h' ? '59m remaining' : expiration === '24h' ? '23h 59m remaining' : expiration === '7d' ? '6d 23h remaining' : 'Never',
            viewsCount: 0,
            createdAt: 'Just now',
            hasPassword: passwordProtected && !!password.trim()
        };

        setSharedLinks([newEntry, ...sharedLinks]);
        setCurrentLink(newUrl);
        handleCopy();
        setActiveTab('links');
    };

    if (!isOpen || !file) return null;

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/85 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-lg bg-[#202327] border-2 border-white/10 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10"
                >
                    {/* Header Eyebrow */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0720C6] text-white">
                            ACCESS CONTROL & CIPHER DISPATCH
                        </span>
                        <span className="text-[10px] font-mono text-[#B8FE00] font-bold">
                            AES-256 TOKENIZED
                        </span>
                    </div>

                    <h2 className="text-3xl font-bold uppercase tracking-wider text-white font-display mb-2">
                        SHARE VAULT ASSET
                    </h2>

                    {/* File Pill Info */}
                    <div className="p-3 bg-[#16181B] border border-white/10 mb-6 flex items-center justify-between">
                        <div className="min-w-0 pr-3">
                            <p className="text-xs font-bold text-white truncate" title={file.originalName}>
                                {file.originalName}
                            </p>
                            <p className="text-[10px] font-mono text-white/50 mt-0.5">
                                {formatSize(file.size)} • <span className="uppercase text-[#B8FE00]">{file.mimeType.split('/')[1] || 'FILE'}</span>
                            </p>
                        </div>
                        <span className="px-2 py-0.5 bg-black/60 border border-white/10 text-[9px] font-mono text-white/60 shrink-0">
                            ID: {file._id.slice(-6).toUpperCase()}
                        </span>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/10 mb-6">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`pb-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                                activeTab === 'create'
                                    ? 'border-[#B8FE00] text-[#B8FE00]'
                                    : 'border-transparent text-white/50 hover:text-white'
                            }`}
                        >
                            Generate Link
                        </button>
                        <button
                            onClick={() => setActiveTab('links')}
                            className={`pb-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                activeTab === 'links'
                                    ? 'border-[#B8FE00] text-[#B8FE00]'
                                    : 'border-transparent text-white/50 hover:text-white'
                            }`}
                        >
                            <span>Active Links</span>
                            <span className="px-1.5 py-0.2 bg-white/10 text-[10px] text-white">
                                {sharedLinks.length}
                            </span>
                        </button>
                    </div>

                    {activeTab === 'create' ? (
                        <div className="space-y-5">
                            {/* Permission Scope */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    ACCESS PERMISSION POLICY
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAccessScope('view_only')}
                                        className={`p-3 text-left border transition-all ${
                                            accessScope === 'view_only'
                                                ? 'bg-[#0720C6]/20 border-[#0720C6] text-white'
                                                : 'bg-[#16181B] border-white/10 text-white/60 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <LuShieldCheck className={accessScope === 'view_only' ? 'text-blue-400' : ''} />
                                            <span className="font-bold text-xs uppercase font-mono">Stream Only</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-tight">
                                            Preview & stream within sandbox. Decrypted download disabled.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAccessScope('full_access')}
                                        className={`p-3 text-left border transition-all ${
                                            accessScope === 'full_access'
                                                ? 'bg-[#B8FE00]/15 border-[#B8FE00] text-white'
                                                : 'bg-[#16181B] border-white/10 text-white/60 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <LuGlobe className={accessScope === 'full_access' ? 'text-[#B8FE00]' : ''} />
                                            <span className="font-bold text-xs uppercase font-mono">Full Access</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-tight">
                                            Permits preview, high-speed streaming, and raw asset download.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Expiration Duration */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>LINK LIFESPAN (TTL)</span>
                                    <LuClock className="text-white/40" />
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['1h', '24h', '7d', 'never'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setExpiration(t)}
                                            className={`py-2 text-center text-xs font-mono font-bold uppercase transition-all border ${
                                                expiration === t
                                                    ? 'bg-[#B8FE00] text-black border-[#B8FE00]'
                                                    : 'bg-[#16181B] border-white/10 text-white/70 hover:border-white/30'
                                            }`}
                                        >
                                            {t === '1h' ? '1 Hour' : t === '24h' ? '24 Hours' : t === '7d' ? '7 Days' : 'Never'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Optional Password Protection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={passwordProtected}
                                            onChange={(e) => setPasswordProtected(e.target.checked)}
                                            className="accent-[#B8FE00] w-4 h-4 cursor-pointer"
                                        />
                                        <span>ENCRYPT WITH PASSPHRASE</span>
                                    </label>
                                    <LuLock className="text-white/40 text-xs" />
                                </div>
                                {passwordProtected && (
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter passphrase for recipient..."
                                        className="w-full px-3 py-2 bg-[#16181B] border border-white/20 text-white font-mono text-xs focus:border-[#B8FE00] focus:outline-none"
                                    />
                                )}
                            </div>

                            {/* Generated Link Input */}
                            <div className="pt-2">
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-1.5">
                                    CRYPTOGRAPHIC DISPATCH URL
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            readOnly
                                            value={currentLink}
                                            className="w-full px-3.5 py-2.5 bg-[#16181B] border border-white/20 text-white font-mono text-xs select-all focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="px-4 py-2.5 bg-[#B8FE00] hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider border border-[#B8FE00] shadow-[0_0_15px_rgba(184,254,0,0.3)] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                                    >
                                        {copied ? <LuCheck className="text-sm font-bold" /> : <LuCopy className="text-sm" />}
                                        <span>{copied ? 'COPIED' : 'COPY'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Create Link Action */}
                            <div className="pt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-[#16181B] border border-white/20 text-white font-mono uppercase text-xs tracking-wider hover:border-white/40 transition-colors"
                                >
                                    CLOSE
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateLink}
                                    className="flex-1 py-2.5 bg-[#0720C6] hover:bg-[#0825e6] text-white font-mono font-bold uppercase text-xs tracking-wider border border-[#0720C6] shadow-[0_0_15px_rgba(7,32,198,0.4)] transition-all flex items-center justify-center gap-2"
                                >
                                    <LuShare2 size={14} />
                                    <span>REGISTER LINK</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Active Links Management Tab */
                        <div className="space-y-4">
                            <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                                {sharedLinks.map((link) => (
                                    <div key={link.id} className="p-3.5 bg-[#16181B] border border-white/10 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                                                    link.permission === 'view_only' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'bg-[#B8FE00]/20 text-[#B8FE00] border border-[#B8FE00]/40'
                                                }`}>
                                                    {link.permission === 'view_only' ? 'STREAM ONLY' : 'FULL ACCESS'}
                                                </span>
                                                {link.hasPassword && (
                                                    <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[9px] font-mono">
                                                        PIN PROTECTED
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono text-white/50">
                                                {link.viewsCount} ACCESS HITS
                                            </span>
                                        </div>

                                        <p className="font-mono text-xs text-white/80 truncate bg-black/40 p-1.5 border border-white/5">
                                            {link.url}
                                        </p>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[10px] font-mono text-white/40">
                                                EXPIRES: <span className="text-white/80">{link.expiresAt}</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(link.url);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase border border-white/15 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                                <button
                                                    onClick={() => handleRevoke(link.id)}
                                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-mono text-[10px] uppercase border border-red-500/30 transition-colors flex items-center gap-1"
                                                >
                                                    <LuTrash2 size={11} />
                                                    <span>Revoke</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {sharedLinks.length === 0 && (
                                    <div className="text-center py-8 text-neutral-500 font-mono text-xs border border-dashed border-white/10">
                                        NO ACTIVE PUBLIC DISPATCH TOKENS
                                    </div>
                                )}
                            </div>

                            <div className="pt-3">
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="w-full py-2.5 bg-[#B8FE00] text-black font-mono font-bold uppercase text-xs tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(184,254,0,0.3)]"
                                >
                                    + GENERATE NEW LINK
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
