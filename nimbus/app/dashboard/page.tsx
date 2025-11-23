"use client";

import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import Upload from '../components/Upload';
import FileList from '../components/FileList';
import TelegramConnect from '../components/TelegramConnect';
import api from '../../lib/api';

const Dashboard = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isTelegramConnected, setIsTelegramConnected] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await api.get('/auth/me');
                setIsTelegramConnected(res.data.isTelegramConnected);
            } catch (error) {
                console.error("Failed to fetch user info", error);
            } finally {
                setLoading(false);
            }
        };
        checkConnection();
    }, []);

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleTelegramConnected = () => {
        setIsTelegramConnected(true);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="text-white">Loading...</div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Cloud Storage</h1>

                {!isTelegramConnected ? (
                    <div className="mb-8">
                        <TelegramConnect onConnected={handleTelegramConnected} />
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <Upload onUploadComplete={handleUploadComplete} />
                        </div>
                        <FileList refreshTrigger={refreshTrigger} />
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default Dashboard;
