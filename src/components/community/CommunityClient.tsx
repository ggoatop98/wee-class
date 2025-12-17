
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types';
import { PageHeader } from '../PageHeader';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import PostList from './PostList';
import { Search } from 'lucide-react';

export default function CommunityClient() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "posts"), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredPosts = useMemo(() => {
        if (!searchTerm) {
            return posts;
        }
        return posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [posts, searchTerm]);

    return (
        <>
            <PageHeader title="커뮤니티">
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="제목을 검색해주세요."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={() => router.push('/community/new')}>게시글 작성</Button>
            </PageHeader>
            <p className="text-muted-foreground mb-8">자유롭게 이야기를 나누는 공간입니다.</p>
            <PostList posts={filteredPosts} loading={loading} />
        </>
    );
}
