
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Student, AppointmentType } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const appointmentSchema = z.object({
  studentName: z.string().min(1, '내담자 이름을 입력해주세요.'),
  date: z.date({ required_error: '날짜를 선택해주세요.' }),
  startHour: z.string().min(1, '시간을 선택해주세요.'),
  startMinute: z.string().min(1, '분을 선택해주세요.'),
  type: z.enum(['개인상담', '집단상담', '학부모상담', '교원자문', '기타']),
  repeatSetting: z.string().optional(),
  repeatCount: z.coerce.number().optional(),
  memo: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment?: Appointment | null;
  students: Student[]; // Keep for compatibility, but not used for selection
}

export default function AppointmentForm({ isOpen, onOpenChange, appointment }: AppointmentFormProps) {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      studentName: '',
      date: new Date(),
      startHour: '13',
      startMinute: '00',
      type: '개인상담',
      repeatSetting: '해당 없음',
      repeatCount: 1,
      memo: '',
    },
  });

  const repeatSetting = useWatch({
    control: form.control,
    name: "repeatSetting"
  });

  useEffect(() => {
    if (appointment) {
        const [hour, minute] = appointment.startTime.split(':');
        form.reset({
            studentName: appointment.studentName,
            date: new Date(appointment.date),
            startHour: hour,
            startMinute: minute,
            type: appointment.type || '개인상담',
            repeatSetting: appointment.repeatSetting,
            repeatCount: appointment.repeatCount || 1,
            memo: appointment.memo || '',
        });
    } else {
        form.reset({
            studentName: '',
            date: new Date(),
            startHour: '13',
            startMinute: '00',
            type: '개인상담',
            repeatSetting: '해당 없음',
            repeatCount: 1,
            memo: '',
        });
    }
  }, [appointment, form, isOpen]);

  const onSubmit = async (data: AppointmentFormValues) => {
    const submissionData: Omit<Appointment, 'id' | 'excludedDates'> = {
      title: `${data.studentName} 학생 ${data.type}`, // Auto-generated title
      studentName: data.studentName,
      studentId: '', // No longer linked to a specific student record
      date: format(data.date, 'yyyy-MM-dd'),
      startTime: `${data.startHour}:${data.startMinute}`,
      endTime: '', // Removed
      type: data.type,
      repeatSetting: data.repeatSetting ?? '해당 없음',
      memo: data.memo,
    };

    if (data.repeatSetting && data.repeatSetting !== '해당 없음') {
      submissionData.repeatCount = data.repeatCount;
    }

    try {
      if (appointment) {
        await setDoc(doc(db, 'appointments', appointment.id), submissionData, { merge: true });
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

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      form.setValue('date', selectedDate, { shouldValidate: true });
      setIsCalendarOpen(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{appointment ? '일정 수정' : '일정 추가'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>날짜</FormLabel>
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ko })
                          ) : (
                            <span>날짜 선택</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={handleDateSelect}
                            disabled={(date) =>
                            date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={ko}
                        />
                    </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}/>

            <FormField control={form.control} name="studentName" render={({ field }) => (
                <FormItem><FormLabel>내담자명</FormLabel><FormControl><Input placeholder="예: 홍길동" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startHour" render={({ field }) => (
                    <FormItem><FormLabel>시간</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                        <SelectValue placeholder="시간" />
                    </SelectTrigger></FormControl><SelectContent>
                        {Array.from({ length: 10 }, (_, i) => String(8 + i).padStart(2, '0')).map(hour => (
                            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                    </SelectContent></Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="startMinute" render={({ field }) => (
                    <FormItem><FormLabel>분</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                        <SelectValue placeholder="분" />
                    </SelectTrigger></FormControl><SelectContent>
                        {['00', '10', '20', '30', '40', '50'].map(min => (
                             <SelectItem key={min} value={min}>{min}</SelectItem>
                        ))}
                    </SelectContent></Select>
                    <FormMessage /></FormItem>
                )}/>
            </div>

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>상담 종류</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="상담 종류 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="개인상담">개인상담</SelectItem>
                    <SelectItem value="집단상담">집단상담</SelectItem>
                    <SelectItem value="학부모상담">학부모상담</SelectItem>
                    <SelectItem value="교원자문">교원자문</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

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
            
            {repeatSetting && repeatSetting !== '해당 없음' && (
              <FormField control={form.control} name="repeatCount" render={({ field }) => (
                  <FormItem><FormLabel>반복 횟수</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value)}><FormControl><SelectTrigger>
                      <SelectValue placeholder="반복 횟수 선택" />
                  </SelectTrigger></FormControl><SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(count => (
                          <SelectItem key={count} value={String(count)}>{count}회</SelectItem>
                      ))}
                  </SelectContent></Select>
                  <FormMessage /></FormItem>
              )}/>
            )}

            <FormField control={form.control} name="memo" render={({ field }) => (
                <FormItem><FormLabel>메모</FormLabel><FormControl><Textarea placeholder="일정에 대한 메모를 남기세요." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
              <Button type="submit">확인</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
