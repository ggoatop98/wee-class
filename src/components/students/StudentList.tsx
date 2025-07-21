
"use client";

import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, BookUser, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Student, StudentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: StudentStatus) => void;
  loading: boolean;
}

export default function StudentList({ students, onEdit, onDelete, onUpdateStatus, loading }: StudentListProps) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>학반</TableHead>
              <TableHead>성별</TableHead>
              <TableHead>의뢰자</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>상담분야</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
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
            <TableHead className="w-[120px]">이름</TableHead>
            <TableHead>학반</TableHead>
            <TableHead>성별</TableHead>
            <TableHead>의뢰자</TableHead>
            <TableHead>연락처</TableHead>
            <TableHead>상담분야</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-center w-[160px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                등록된 내담자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.name}
                </TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.requester || '-'}</TableCell>
                <TableCell>{student.contact || '-'}</TableCell>
                <TableCell>{student.counselingField || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge 
                        variant={student.status === '종결' ? 'destructive' : 'secondary'}
                        className="cursor-pointer"
                      >
                        {student.status}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onUpdateStatus(student.id, '상담중')}>상담중</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(student.id, '종결')}>종결</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-center">
                   <Link href={`/records/${student.id}?studentName=${encodeURIComponent(student.name)}`}>
                    <Button variant="outline" size="sm" className="mr-2">
                        <BookUser className="h-4 w-4 mr-1" />
                        상담일지
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(student)} title="수정">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">수정</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="삭제">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          이 작업은 되돌릴 수 없습니다. 내담자 정보와 관련된 모든 데이터가 영구적으로 삭제될 수 있습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
