
"use client";

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
import type { Appointment } from '@/types';
import truncate from 'truncate';

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  loading: boolean;
}

export default function AppointmentList({ appointments, onEdit, onDelete, loading }: AppointmentListProps) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
             <TableRow>
                <TableHead className="text-base">날짜</TableHead>
                <TableHead className="text-base">시간</TableHead>
                <TableHead className="text-base">상담 종류</TableHead>
                <TableHead className="text-base">내담자</TableHead>
                <TableHead className="text-base">메모</TableHead>
                <TableHead className="text-right text-base">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
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
            <TableHead className="w-[150px] text-base">날짜</TableHead>
            <TableHead className="w-[120px] text-base">시간</TableHead>
            <TableHead className="text-base">상담 종류</TableHead>
            <TableHead className="w-[150px] text-base">내담자</TableHead>
            <TableHead className="text-base">메모</TableHead>
            <TableHead className="text-right w-[120px] text-base">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
             <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-base">
                등록된 일정이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-base">{new Date(item.date).toLocaleDateString('ko-KR', { timeZone: 'UTC' })}</TableCell>
                <TableCell className="text-base">{`${item.startTime}`}</TableCell>
                <TableCell className="font-medium text-base">{item.type}</TableCell>
                <TableCell className="text-base">{item.studentName}</TableCell>
                <TableCell className="text-base text-muted-foreground">{truncate(item.memo || '', 30)}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">수정</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          이 작업은 되돌릴 수 없습니다. 일정 정보가 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(item)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
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
