import React, { useState } from 'react';
import api from '@/lib/api';

interface TelegramConnectProps {
    onConnected: () => void;
}

const TelegramConnect: React.FC<TelegramConnectProps> = ({ onConnected }) => {
    const [step, setStep] = useState<'PHONE' | 'CODE' | 'PASSWORD'>('PHONE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [session, setSession] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/telegram/connect', { phoneNumber });
            setPhoneCodeHash(res.data.phoneCodeHash);
            setSession(res.data.session);
            setStep('CODE');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/telegram/verify', {
                phoneNumber,
                code,
                phoneCodeHash,
                session,
                password
            });
            onConnected();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed';
            if (msg.includes('password') || msg.includes('SESSION_PASSWORD_NEEDED')) {
                setStep('PASSWORD');
                setError('Two-step verification required');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Connect Telegram Storage
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {step === 'PHONE' && (
                <form onSubmit={handleSendCode}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="phoneNumber">
                            Phone Number
                        </label>
                        <input
                            id="phoneNumber"
                            type="text"
                            placeholder="+1234567890"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1...)</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Code'}
                    </button>
                </form>
            )}

            {step === 'CODE' && (
                <form onSubmit={handleVerify}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="code">
                            Verification Code
                        </label>
                        <input
                            id="code"
                            type="text"
                            placeholder="12345"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Verifying...' : 'Verify & Connect'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('PHONE')}
                        className="mt-4 text-sm text-blue-500 hover:text-blue-700 w-full text-center"
                    >
                        Change Phone Number
                    </button>
                </form>
            )}

            {step === 'PASSWORD' && (
                <form onSubmit={handleVerify}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Two-Step Verification Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Verifying...' : 'Verify Password'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('CODE')}
                        className="mt-4 text-sm text-blue-500 hover:text-blue-700 w-full text-center"
                    >
                        Back to Code
                    </button>
                </form>
            )}
        </div>
    );
};

export default TelegramConnect;
