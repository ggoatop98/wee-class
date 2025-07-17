"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { CounselingLog, Student } from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const logSchema = z.object({
  counselingDate: z.string().min(1, '상담 날짜를 입력해주세요.'),
  counselingTime: z.string().min(1, '상담 시간을 입력해주세요.'),
  counselingSubject: z.string().min(1, '상담 주제를 입력해주세요.'),
  counselingDetails: z.string().min(1, '상담 내용을 입력해주세요.'),
});

type LogFormValues = z.infer<typeof logSchema>;

interface CounselingLogFormProps {
  student: Student | null;
  log?: CounselingLog | null;
  onSave: () => void;
}

export default function CounselingLogForm({ student, log, onSave }: CounselingLogFormProps) {
  const { toast } = useToast();
  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      counselingDate: new Date().toISOString().split('T')[0],
      counselingTime: new Date().toTimeString().substring(0, 5),
      counselingSubject: '',
      counselingDetails: '',
    },
  });

  useEffect(() => {
    if (log) {
      form.reset({
        counselingDate: log.counselingDate,
        counselingTime: log.counselingTime,
        counselingSubject: log.counselingSubject,
        counselingDetails: log.counselingDetails,
      });
    } else {
      form.reset({
        counselingDate: new Date().toISOString().split('T')[0],
        counselingTime: new Date().toTimeString().substring(0, 5),
        counselingSubject: '',
        counselingDetails: '',
      });
    }
  }, [log, form]);
  
  const onSubmit = async (data: LogFormValues) => {
    if (!student) {
        toast({ variant: 'destructive', title: '오류', description: '내담자가 선택되지 않았습니다.' });
        return;
    }

    const submissionData = {
      ...data,
      studentId: student.id,
      appointmentId: log?.appointmentId || '', // This might need linking to an appointment
    };

    try {
      const batch = writeBatch(db);

      if (log) {
        const logRef = doc(db, 'counselingLogs', log.id);
        batch.set(logRef, submissionData);
      } else {
        const logRef = doc(collection(db, 'counselingLogs'));
        batch.set(logRef, submissionData);
      }
      
      // If there's a related appointment, mark counselingLogExists as true
      if (log?.appointmentId) {
        const appointmentRef = doc(db, 'appointments', log.appointmentId);
        batch.update(appointmentRef, { counselingLogExists: true });
      }

      await batch.commit();

      toast({
        title: '성공',
        description: '상담일지가 저장되었습니다.',
      });
      onSave();

    } catch (error) {
      console.error('Error saving counseling log: ', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상담일지 저장 중 오류가 발생했습니다.',
      });
    }
  };

  if (!student) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{log ? '상담 내용 수정' : '새 상담 내용'}</CardTitle>
        <CardDescription>
          상담 내용을 상세히 기록하고 저장하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="counselingDate" render={({ field }) => (
                <FormItem><FormLabel>상담 날짜</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="counselingTime" render={({ field }) => (
                <FormItem><FormLabel>상담 시간</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="counselingSubject" render={({ field }) => (
              <FormItem><FormLabel>상담 주제</FormLabel><FormControl><Input placeholder="예: 친구 관계의 어려움" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="counselingDetails" render={({ field }) => (
              <FormItem><FormLabel>상담 내용</FormLabel><FormControl><Textarea placeholder="상담 내용을 상세하게 기록하세요." {...field} rows={10} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onSave}>취소</Button>
                <Button type="submit">저장</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
