
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const studentSchema = z.object({
  name: z.string().min(1, { message: '이름을 입력해주세요.' }),
  class: z.string().min(1, { message: '학반을 입력해주세요.' }),
  gender: z.enum(['남', '여']),
  status: z.enum(['상담중', '종결']),
  requester: z.enum(['학생', '학부모', '교사', '기타']).optional(),
  contact: z.string().optional(),
  counselingField: z.string().optional(),
  memo: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student?: Student | null;
}

export default function StudentForm({ isOpen, onOpenChange, student }: StudentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      class: '',
      gender: '남',
      status: '상담중',
      requester: '학생',
      contact: '',
      counselingField: '기타',
      memo: '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        class: student.class,
        gender: student.gender,
        status: student.status || '상담중',
        requester: student.requester || '학생',
        contact: student.contact || '',
        counselingField: student.counselingField || '기타',
        memo: student.memo || '',
      });
    } else {
      form.reset({
        name: '',
        class: '',
        gender: '남',
        status: '상담중',
        requester: '학생',
        contact: '',
        counselingField: '기타',
        memo: '',
      });
    }
  }, [student, form, isOpen]);
  
  const onSubmit = async (data: StudentFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: '오류', description: '로그인이 필요합니다.' });
        return;
    }

    try {
      if (student) {
        const studentDataToUpdate = { 
            ...data, 
            userId: user.uid // Ensure userId is included on update
        };
        await setDoc(doc(db, 'students', student.id), studentDataToUpdate, { merge: true });
        toast({
          title: '성공',
          description: '내담자 정보가 수정되었습니다.',
        });
      } else {
        const studentDataToAdd = {
          ...data,
          userId: user.uid,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(db, 'students'), studentDataToAdd);
        toast({
          title: '성공',
          description: '새로운 내담자가 추가되었습니다.',
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving student: ', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '정보 저장 중 오류가 발생했습니다.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{student ? '내담자 수정' : '내담자 추가'}</DialogTitle>
          <DialogDescription>내담자의 기본 정보를 입력하세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>학반</FormLabel>
                    <FormControl>
                      <Input placeholder="3-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>성별</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="남">남</SelectItem>
                        <SelectItem value="여">여</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="상담중">상담중</SelectItem>
                        <SelectItem value="종결">종결</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="requester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>의뢰자</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="의뢰자 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="학생">학생</SelectItem>
                        <SelectItem value="학부모">학부모</SelectItem>
                        <SelectItem value="교사">교사</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="counselingField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상담분야</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상담분야 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="친구관계">친구관계</SelectItem>
                        <SelectItem value="충동성/과잉행동">충동성/과잉행동</SelectItem>
                        <SelectItem value="주의력">주의력</SelectItem>
                        <SelectItem value="분노조절">분노조절</SelectItem>
                        <SelectItem value="우울/불안">우울/불안</SelectItem>
                        <SelectItem value="가족">가족</SelectItem>
                        <SelectItem value="학업">학업</SelectItem>
                        <SelectItem value="진로">진로</SelectItem>
                        <SelectItem value="지능">지능</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea placeholder="특이사항 등을 기록하세요." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
