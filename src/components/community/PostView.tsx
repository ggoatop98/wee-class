
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, Timestamp, query, orderBy, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, Comment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '../PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PostViewProps {
    postId: string;
}

export default function PostView({ postId }: PostViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const postRef = doc(db, 'posts', postId);
        
        const unsubPost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setPost({ id: doc.id, ...doc.data() } as Post);
            } else {
                toast({ variant: 'destructive', title: '오류', description: '게시글을 찾을 수 없습니다.'});
                router.push('/community');
            }
            setLoading(false);
        });

        const commentsQuery = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
        const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
        });

        return () => {
            unsubPost();
            unsubComments();
        };

    }, [postId, router, toast]);

    const handleAddComment = async () => {
        if (newComment.trim() === '' || !user) return;
        
        const postRef = doc(db, 'posts', postId);

        try {
            await addDoc(collection(db, `posts/${postId}/comments`), {
                content: newComment,
                authorId: user.uid,
                authorName: user.displayName || user.email,
                createdAt: Timestamp.now()
            });

            await updateDoc(postRef, {
                commentCount: increment(1)
            });

            setNewComment('');
            toast({ title: '성공', description: '댓글이 작성되었습니다.', duration: 500 });
        } catch (error) {
            console.error('Error adding comment: ', error);
            toast({ variant: 'destructive', title: '오류', description: '댓글 작성 중 오류가 발생했습니다.' });
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;
        try {
            await deleteDoc(doc(db, 'posts', post.id));
            toast({ title: '성공', description: '게시글이 삭제되었습니다.', duration: 500 });
            router.push('/community');
        } catch (error) {
            console.error('Error deleting post: ', error);
            toast({ variant: 'destructive', title: '오류', description: '게시글 삭제 중 오류가 발생했습니다.' });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const postRef = doc(db, 'posts', postId);
        try {
            await deleteDoc(doc(db, `posts/${postId}/comments`, commentId));
            
            await updateDoc(postRef, {
                commentCount: increment(-1)
            });

            toast({ title: '성공', description: '댓글이 삭제되었습니다.', duration: 500 });
        } catch (error) {
            console.error('Error deleting comment: ', error);
            toast({ variant: 'destructive', title: '오류', description: '댓글 삭제 중 오류가 발생했습니다.' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!post) {
        return null;
    }

    return (
        <>
            <PageHeader title="게시글 보기">
                <Button variant="outline" onClick={() => router.push('/community')}>목록으로</Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>작성자: {post.authorName}</span>
                        <span>{format(post.createdAt.toDate(), 'yyyy.MM.dd HH:mm')}</span>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="py-6">
                    <div
                        className="prose max-w-none prose-sm sm:prose-base min-h-[200px]"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </CardContent>
                 <CardFooter className="flex justify-end">
                    {user?.uid === post.authorId && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push(`/community/edit/${post.id}`)}>수정</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">삭제</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            이 작업은 되돌릴 수 없습니다. 게시글이 영구적으로 삭제됩니다.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </CardFooter>
            </Card>

            {/* Comments Section */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">댓글 ({comments.length})</h3>
                <div className="space-y-4 mb-6">
                    {comments.map(comment => (
                        <Card key={comment.id} className="bg-muted/50">
                            <CardHeader className="p-4 flex flex-row justify-between items-start">
                                <div>
                                    <p className="font-semibold">{comment.authorName}</p>
                                    <p className="text-xs text-muted-foreground">{format(comment.createdAt.toDate(), 'yyyy.MM.dd HH:mm')}</p>
                                </div>
                                {user?.uid === comment.authorId && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                이 작업은 되돌릴 수 없습니다. 댓글이 영구적으로 삭제됩니다.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>취소</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Textarea 
                        placeholder="댓글을 입력하세요."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleAddComment}>댓글 작성</Button>
                </div>
            </div>
        </>
    );
}
