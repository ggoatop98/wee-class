
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface PostListProps {
  posts: Post[];
  loading: boolean;
}

export default function PostList({ posts, loading }: PostListProps) {
    const router = useRouter();

    const handleRowClick = (postId: string) => {
        router.push(`/community/post/${postId}`);
    }

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
             <TableRow>
                <TableHead className="w-[100px]">순서</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>댓글</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] text-center">순서</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="w-[200px] text-center">작성자</TableHead>
            <TableHead className="w-[150px] text-center">작성일</TableHead>
            <TableHead className="w-[100px] text-center">댓글</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
             <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-base">
                등록된 게시글이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post, index) => (
              <TableRow key={post.id} onClick={() => handleRowClick(post.id)} className="cursor-pointer">
                <TableCell className="text-center">{posts.length - index}</TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="text-center">{post.authorName}</TableCell>
                <TableCell className="text-center">{format(post.createdAt.toDate(), 'yy.MM.dd.')}</TableCell>
                <TableCell className="text-center">{post.commentCount || 0}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
