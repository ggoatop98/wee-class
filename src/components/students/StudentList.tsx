
"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, BookUser, ClipboardList, Beaker, Upload, FolderArchive, ClipboardSignature, ClipboardPen } from 'lucide-react';
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
  onOpenFileUploadModal: (student: Student) => void;
  loading: boolean;
}

export default function StudentList({ students, onEdit, onDelete, onUpdateStatus, onOpenFileUploadModal, loading }: StudentListProps) {

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
              <TableHead>정서행동특성검사</TableHead>
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
                <TableCell className="text-center"><Skeleton className="h-8 w-48 mx-auto" /></TableCell>
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
            <TableHead className="w-[120px] text-base">이름</TableHead>
            <TableHead className="text-base">학반</TableHead>
            <TableHead className="text-base">성별</TableHead>
            <TableHead className="text-base">의뢰자</TableHead>
            <TableHead className="text-base">연락처</TableHead>
            <TableHead className="text-base">정서행동특성검사</TableHead>
            <TableHead className="text-base">상태</TableHead>
            <TableHead className="text-center w-[480px] text-base">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-base">
                등록된 내담자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-base">
                  {student.name}
                </TableCell>
                <TableCell className="text-base">{student.class}</TableCell>
                <TableCell className="text-base">{student.gender}</TableCell>
                <TableCell className="text-base">{student.requester || '-'}</TableCell>
                <TableCell className="text-base">{student.contact || '-'}</TableCell>
                <TableCell className="text-base">{student.counselingField || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge 
                        variant={student.status === '종결' ? 'destructive' : 'secondary'}
                        className="cursor-pointer text-base"
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-2">
                      <Link href={`/records/${student.id}/parent-application?studentName=${encodeURIComponent(student.name)}`}>
                        <Button variant="outline" size="sm">
                            <ClipboardSignature className="h-4 w-4 mr-1" />
                            학부모 신청서
                        </Button>
                      </Link>
                       <Link href={`/records/${student.id}/teacher-referral?studentName=${encodeURIComponent(student.name)}`}>
                        <Button variant="outline" size="sm">
                            <ClipboardPen className="h-4 w-4 mr-1" />
                            교사 의뢰서
                        </Button>
                      </Link>
                       <Link href={`/records/${student.id}/conceptualization?studentName=${encodeURIComponent(student.name)}`}>
                        <Button variant="outline" size="sm">
                            <ClipboardList className="h-4 w-4 mr-1" />
                            사례개념화
                        </Button>
                      </Link>
                       <Link href={`/records/${student.id}?studentName=${encodeURIComponent(student.name)}`}>
                        <Button variant="outline" size="sm">
                            <BookUser className="h-4 w-4 mr-1" />
                            상담일지
                        </Button>
                      </Link>
                      <Link href={`/records/${student.id}/tests?studentName=${encodeURIComponent(student.name)}`}>
                        <Button variant="outline" size="sm">
                            <Beaker className="h-4 w-4 mr-1" />
                            심리검사
                        </Button>
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onOpenFileUploadModal(student)} title="파일">
                        <FolderArchive className="h-4 w-4"/>
                        <span className="sr-only">파일</span>
                      </Button>
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
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
