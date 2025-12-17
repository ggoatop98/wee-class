
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '../PageHeader';
import { Card, CardContent } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import RichTextEditor from '../ui/RichTextEditor';
import { Button } from '../ui/button';

const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostEditorProps {
    post?: Post | null;
}

export default function PostEditor({ post }: PostEditorProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: post?.title || '',
            content: post?.content || '',
        },
    });
    
    const onSubmit = async (data: PostFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: '오류', description: '로그인이 필요합니다.' });
            return;
        }

        try {
            if (post) {
                const postRef = doc(db, 'posts', post.id);
                await setDoc(postRef, {
                    ...data,
                    updatedAt: Timestamp.now(),
                }, { merge: true });
                toast({ title: '성공', description: '게시글이 수정되었습니다.' });
                router.push(`/community/post/${post.id}`);
            } else {
                const newPost = {
                    ...data,
                    authorId: user.uid,
                    authorName: user.displayName || user.email,
                    createdAt: Timestamp.now(),
                    commentCount: 0,
                };
                await addDoc(collection(db, 'posts'), newPost);
                toast({ title: '성공', description: '게시글이 작성되었습니다.' });
                router.push('/community');
            }
        } catch (error) {
            console.error('Error saving post: ', error);
            toast({ variant: 'destructive', title: '오류', description: '게시글 저장 중 오류가 발생했습니다.' });
        }
    };
    
    return (
        <>
            <PageHeader title={post ? '게시글 수정' : '게시글 작성'} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>제목</FormLabel>
                                        <FormControl>
                                            <Input placeholder="제목을 입력하세요." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>내용</FormLabel>
                                        <FormControl>
                                            <RichTextEditor
                                                key={post?.id || 'new-post'}
                                                content={field.value}
                                                onChange={field.onChange}
                                                placeholder="내용을 입력하세요..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
                        <Button type="submit">저장</Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
