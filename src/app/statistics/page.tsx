
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import StatisticsClient from '@/components/statistics/StatisticsClient';

function StatisticsPageContent() {
    return (
        <AppLayout>
            <main className="p-8">
                <StatisticsClient />
            </main>
        </AppLayout>
    );
}

export default function StatisticsPage() {
    return (
        <AuthGuard>
            <StatisticsPageContent />
        </AuthGuard>
    )
}
