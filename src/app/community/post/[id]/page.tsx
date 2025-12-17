
'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import PostView from '@/components/community/PostView';
import { useParams } from 'next/navigation';

function PostPageContent() {
    const params = useParams();
    const postId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!postId) {
        return (
            <AppLayout>
                <main className="p-8">
                    <div>Loading...</div>
                </main>
            </AppLayout>
        );
    }
    return (
        <AppLayout>
            <main className="p-8">
                <PostView postId={postId} />
            </main>
        </AppLayout>
    );
}


export default function PostPage() {
    return (
        <AuthGuard>
            <PostPageContent />
        </AuthGuard>
    )
}
