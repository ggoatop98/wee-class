
'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import PostEditor from '@/components/community/PostEditor';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/types';

function EditPostPageContent() {
    const params = useParams();
    const postId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [post, setPost] = React.useState<Post | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!postId) return;
        const fetchPost = async () => {
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                setPost({ id: postSnap.id, ...postSnap.data() } as Post);
            }
            setLoading(false);
        }
        fetchPost();
    }, [postId]);

    if (loading) {
        return <AppLayout><main className="p-8"><div>Loading...</div></main></AppLayout>;
    }
    
    if (!post) {
        return <AppLayout><main className="p-8"><div>게시글을 찾을 수 없습니다.</div></main></AppLayout>;
    }

    return (
        <AppLayout>
            <main className="p-8">
                <PostEditor post={post} />
            </main>
        </AppLayout>
    );
}

export default function EditPostPage() {
    return (
        <AuthGuard>
            <EditPostPageContent />
        </AuthGuard>
    )
}
