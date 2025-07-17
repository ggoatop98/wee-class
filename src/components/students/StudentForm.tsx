"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';

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
  birthdate: z.string().optional(),
  gender: z.enum(['남', '여']),
  contact: z.string().optional(),
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }).optional().or(z.literal('')),
  eacTestResult: z.string().optional(),
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
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      class: '',
      birthdate: '',
      gender: '남',
      contact: '',
      email: '',
      eacTestResult: '해당 없음',
      memo: '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        class: student.class,
        birthdate: student.birthdate,
        gender: student.gender,
        contact: student.contact || '',
        email: student.email || '',
        eacTestResult: student.eacTestResult || '해당 없음',
        memo: student.memo || '',
      });
    } else {
      form.reset({
        name: '',
        class: '',
        birthdate: '',
        gender: '남',
        contact: '',
        email: '',
        eacTestResult: '해당 없음',
        memo: '',
      });
    }
  }, [student, form, isOpen]);
  
  const onSubmit = async (data: StudentFormValues) => {
    try {
      if (student) {
        await setDoc(doc(db, 'students', student.id), data);
        toast({
          title: '성공',
          description: '내담자 정보가 수정되었습니다.',
        });
      } else {
        await addDoc(collection(db, 'students'), data);
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
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="eacTestResult"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정서행동특성검사</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="검사 결과 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="해당 없음">해당 없음</SelectItem>
                        <SelectItem value="정상">정상</SelectItem>
                        <SelectItem value="관심군">관심군</SelectItem>
                         <SelectItem value="주의군">주의군</SelectItem>
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
