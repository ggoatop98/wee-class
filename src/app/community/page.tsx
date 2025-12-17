
'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import CommunityClient from '@/components/community/CommunityClient';

function CommunityPageContent() {
    return (
        <AppLayout>
            <main className="p-8">
                <CommunityClient />
            </main>
        </AppLayout>
    );
}


export default function CommunityPage() {
    return (
        <AuthGuard>
            <CommunityPageContent />
        </AuthGuard>
    )
}
