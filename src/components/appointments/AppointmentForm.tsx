"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Student } from '@/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const appointmentSchema = z.object({
  type: z.enum(['상담', '검사', '자문', '교육', '연구', '의뢰']),
  title: z.string().min(1, '제목을 입력해주세요.'),
  studentId: z.string().min(1, '내담자를 선택해주세요.'),
  date: z.string().min(1, '날짜를 선택해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  endTime: z.string().min(1, '종료 시간을 선택해주세요.'),
  repeatSetting: z.string().optional(),
  memo: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment?: Appointment | null;
  students: Student[];
}

export default function AppointmentForm({ isOpen, onOpenChange, appointment, students }: AppointmentFormProps) {
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: '상담',
      title: '',
      studentId: '',
      date: '',
      startTime: '',
      endTime: '',
      repeatSetting: '해당 없음',
      memo: '',
    },
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (appointment) {
      form.reset({ ...appointment });
    } else {
      form.reset({
        type: '상담',
        title: '',
        studentId: '',
        date: today,
        startTime: '09:00',
        endTime: '10:00',
        repeatSetting: '해당 없음',
        memo: '',
      });
    }
  }, [appointment, form, isOpen]);

  const onSubmit = async (data: AppointmentFormValues) => {
    const selectedStudent = students.find(s => s.id === data.studentId);
    if (!selectedStudent) {
        toast({ variant: 'destructive', title: '오류', description: '선택된 내담자 정보를 찾을 수 없습니다.' });
        return;
    }

    const submissionData = {
        ...data,
        studentName: selectedStudent.name,
        counselingLogExists: appointment?.counselingLogExists || false,
    };

    try {
      if (appointment) {
        await setDoc(doc(db, 'appointments', appointment.id), submissionData);
        toast({ title: '성공', description: '일정 정보가 수정되었습니다.' });
      } else {
        await addDoc(collection(db, 'appointments'), submissionData);
        toast({ title: '성공', description: '새로운 일정이 추가되었습니다.' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving appointment: ', error);
      toast({ variant: 'destructive', title: '오류', description: '일정 저장 중 오류가 발생했습니다.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{appointment ? '일정 수정' : '일정 추가'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="상담" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                {['상담', '검사', '자문', '교육', '연구', '의뢰'].map(tab => (
                  <TabsTrigger key={tab} value={tab} onClick={() => form.setValue('type', tab as AppointmentFormValues['type'])}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>제목</FormLabel><FormControl><Input placeholder="예: 학교 생활 적응 상담" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>내담자 검색</FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value ? (students || []).find((s) => s.id === field.value)?.name : "내담자 선택"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button></FormControl>
                </PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command><CommandInput placeholder="이름으로 검색..." /><CommandList><CommandEmpty>내담자를 찾을 수 없습니다.</CommandEmpty><CommandGroup>
                        {(students || []).map((s) => (
                          <CommandItem value={s.name} key={s.id} onSelect={() => { form.setValue('studentId', s.id); setPopoverOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                            {s.name} ({s.class})
                          </CommandItem>
                        ))}
                    </CommandGroup></CommandList></Command>
                </PopoverContent></Popover>
                <FormMessage />
              </FormItem>
            )}/>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>날짜</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>시작 시간</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>종료 시간</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            <FormField control={form.control} name="repeatSetting" render={({ field }) => (
                <FormItem><FormLabel>반복 설정</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                    <SelectValue placeholder="반복 설정 선택" />
                </SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="해당 없음">해당 없음</SelectItem>
                    <SelectItem value="매주">매주</SelectItem>
                    <SelectItem value="2주마다">2주마다</SelectItem>
                    <SelectItem value="매월">매월</SelectItem>
                </SelectContent></Select>
                <FormMessage /></FormItem>
            )}/>

            <FormField control={form.control} name="memo" render={({ field }) => (
                <FormItem><FormLabel>메모</FormLabel><FormControl><Textarea placeholder="일정에 대한 메모를 남기세요." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
