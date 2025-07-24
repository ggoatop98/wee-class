
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CounselingLog } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '../PageHeader';


const logSchema = z.object({
  counselingDate: z.date({ required_error: '날짜를 선택해주세요.' }),
  counselingHour: z.string().min(1, '시간을 선택해주세요.'),
  counselingMinute: z.string().min(1, '분을 선택해주세요.'),
  mainIssues: z.string().min(1, '상담 내용을 입력해주세요.'),
  therapistComments: z.string().optional(),
  counselingGoals: z.string().optional(),
  sessionContent: z.string().optional(),
  nextSessionGoals: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

interface CounselingLogFormProps {
  studentId: string;
  studentName: string;
  log: CounselingLog | null;
  onSave: (data: Omit<CounselingLog, 'id'>) => void;
  onCancel: () => void;
}

export default function CounselingLogForm({ studentId, studentName, log, onSave, onCancel }: CounselingLogFormProps) {
    const { user } = useAuth();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const form = useForm<LogFormValues>({
        resolver: zodResolver(logSchema),
        defaultValues: {
            counselingDate: new Date(),
            counselingHour: '13',
            counselingMinute: '00',
            mainIssues: '',
            therapistComments: '',
            counselingGoals: '',
            sessionContent: '',
            nextSessionGoals: '',
        },
    });

    useEffect(() => {
        if (log) {
            const [hour, minute] = log.counselingTime.split(':');
            form.reset({
                counselingDate: new Date(log.counselingDate),
                counselingHour: hour || '13',
                counselingMinute: minute || '00',
                mainIssues: log.mainIssues,
                therapistComments: log.therapistComments || '',
                counselingGoals: log.counselingGoals,
                sessionContent: log.sessionContent,
                nextSessionGoals: log.nextSessionGoals,
            });
        } else {
            form.reset({
                counselingDate: new Date(),
                counselingHour: '13',
                counselingMinute: '00',
                mainIssues: '',
                therapistComments: '',
                counselingGoals: '',
                sessionContent: '',
                nextSessionGoals: '',
            });
        }
    }, [log, form]);

    const onSubmit = (data: LogFormValues) => {
        if (!user) return;

        const submissionData = {
            userId: user.uid,
            studentId,
            studentName,
            counselingDate: format(data.counselingDate, 'yyyy-MM-dd'),
            counselingTime: `${data.counselingHour}:${data.counselingMinute}`,
            mainIssues: data.mainIssues,
            therapistComments: data.therapistComments || '',
            counselingGoals: data.counselingGoals || '',
            sessionContent: data.sessionContent || '',
            nextSessionGoals: data.nextSessionGoals || '',
            createdAt: log?.createdAt || new Date()
        };
        onSave(submissionData);
    };
    
    const handleDateSelect = (selectedDate?: Date) => {
        if (selectedDate) {
          form.setValue('counselingDate', selectedDate, { shouldValidate: true });
          setIsCalendarOpen(false);
        }
    };

    const handlePrint = () => {
        const data = form.getValues();
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 30px; margin: 0 auto; max-width: 800px;">
                <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">상담 일지</h1>
                <div style="border: 1px solid #ccc; padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">내담자명</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${studentName}</td>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">상담일시</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${format(data.counselingDate, "yyyy-MM-dd")} ${data.counselingHour}:${data.counselingMinute}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">상담 내용</h2>
                        <div style="min-height: 200px; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${data.mainIssues.replace(/\n/g, '<br />')}</div>
                    </div>
                    <div>
                        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">상담 의견</h2>
                        <div style="min-height: 200px; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${(data.therapistComments || '').replace(/\n/g, '<br />')}</div>
                    </div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>상담일지 인쇄</title>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        } else {
            alert('팝업 차단으로 인해 인쇄 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
        }
    }

    return (
        <Card className="h-full">
            <CardContent className="p-6 h-full flex flex-col">
                <div>
                    <PageHeader title="상담 일지" centered>
                        <Input readOnly value={studentName} className="text-center font-semibold text-lg" />
                    </PageHeader>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow flex flex-col">
                        <div className="flex-grow space-y-4 overflow-auto p-1">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="counselingDate" render={({ field }) => (
                                <FormItem className="flex flex-col justify-end">
                                    <FormLabel>상담 날짜</FormLabel>
                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            {field.value ? format(field.value, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={handleDateSelect} initialFocus locale={ko} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="counselingHour" render={({ field }) => (
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
                                    <FormField control={form.control} name="counselingMinute" render={({ field }) => (
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
                            </div>
                            <FormField control={form.control} name="mainIssues" render={({ field }) => (
                                <FormItem><FormLabel>상담 내용</FormLabel><FormControl><Textarea placeholder="상담 내용을 요약하여 기록하세요." {...field} rows={8} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="therapistComments" render={({ field }) => (
                                <FormItem><FormLabel>상담 의견</FormLabel><FormControl><Textarea placeholder="상담 내용에 대한 의견을 기록하세요." {...field} rows={8} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄
                            </Button>
                            <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
                            <Button type="submit">저장</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
