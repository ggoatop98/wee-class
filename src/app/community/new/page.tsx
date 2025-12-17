
'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import PostEditor from '@/components/community/PostEditor';

function NewPostPageContent() {
    return (
        <AppLayout>
            <main className="p-8">
                <PostEditor />
            </main>
        </AppLayout>
    );
}


export default function NewPostPage() {
    return (
        <AuthGuard>
            <NewPostPageContent />
        </AuthGuard>
    )
}
