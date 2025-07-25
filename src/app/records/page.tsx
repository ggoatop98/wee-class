
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import CombinedRecordsClient from '@/components/records/CombinedRecordsClient';

function RecordsPageContent() {
    return (
        <AppLayout>
            <main className="p-8">
                <CombinedRecordsClient />
            </main>
        </AppLayout>
    );
}


export default function RecordsPage() {
    return (
        <AuthGuard>
            <RecordsPageContent />
        </AuthGuard>
    )
}
