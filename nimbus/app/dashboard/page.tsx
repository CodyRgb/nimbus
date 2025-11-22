"use client";

import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import Upload from '../components/Upload';
import FileList from '../components/FileList';

const Dashboard = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <MainLayout>
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Cloud Storage</h1>
                
                <div className="mb-8">
                    <Upload onUploadComplete={handleUploadComplete} />
                </div>

                <FileList refreshTrigger={refreshTrigger} />
            </div>
        </MainLayout>
    );
};

export default Dashboard;
