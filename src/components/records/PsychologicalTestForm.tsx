
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import { PageHeader } from '../PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PsychologicalTest } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


const testSchema = z.object({
  testName: z.string().min(1, '검사명을 입력해주세요.'),
  testDate: z.date({ required_error: '검사일을 선택해주세요.' }),
  testHour: z.string().min(1, '시간을 선택해주세요.'),
  testMinute: z.string().min(1, '분을 선택해주세요.'),
  results: z.string().min(1, '검사 결과를 입력해주세요.'),
});

type TestFormValues = z.infer<typeof testSchema>;

interface PsychologicalTestFormProps {
    studentName: string;
    initialData: Partial<PsychologicalTest> | null;
    onSave: (data: Omit<TestFormValues, 'testDate'> & { testDate: string }) => void;
    onCancel: () => void;
}

export default function PsychologicalTestForm({ studentName, initialData, onSave, onCancel }: PsychologicalTestFormProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const form = useForm<TestFormValues>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            testName: '',
            testDate: new Date(),
            testHour: '13',
            testMinute: '00',
            results: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            const [hour, minute] = initialData.testTime?.split(':') || ['13', '00'];
            form.reset({
                testName: initialData.testName || '',
                testDate: initialData.testDate ? parseISO(initialData.testDate) : new Date(),
                testHour: hour,
                testMinute: minute,
                results: initialData.results || '',
            });
        } else {
            form.reset({
                testName: '',
                testDate: new Date(),
                testHour: '13',
                testMinute: '00',
                results: '',
            });
        }
    }, [initialData, form]);

    const handleSaveClick = (data: TestFormValues) => {
        onSave({
            ...data,
            testDate: format(data.testDate, 'yyyy-MM-dd'),
        });
    };

    const handleDateSelect = (selectedDate?: Date) => {
        if (selectedDate) {
          form.setValue('testDate', selectedDate, { shouldValidate: true });
          setIsCalendarOpen(false);
        }
    };
    
    const handlePrint = () => {
        const data = form.getValues();
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 30px; margin: 0 auto; max-width: 800px;">
                <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">심리검사 결과</h1>
                <div style="border: 1px solid #ccc; padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">내담자명</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${studentName}</td>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">검사일시</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${format(data.testDate, "yyyy-MM-dd")} ${data.testHour}:${data.testMinute}</td>
                            </tr>
                             <tr>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">검사명</td>
                                <td colspan="3" style="border: 1px solid #ccc; padding: 8px;">${data.testName}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div>
                        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">검사 결과</h2>
                        <div style="min-height: 400px; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${data.results.replace(/\n/g, '<br />')}</div>
                    </div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>심리검사 결과 인쇄</title>');
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
        <div className="flex flex-col h-full p-8">
             <PageHeader title={`${studentName} 심리검사 ${initialData?.id ? '수정' : '작성'}`}>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄
                    </Button>
                    <Button variant="outline" onClick={onCancel}>취소</Button>
                    <Button type="submit" form="psychological-test-form">저장</Button>
                </div>
            </PageHeader>
            <Form {...form}>
                <form id="psychological-test-form" onSubmit={form.handleSubmit(handleSaveClick)} className="space-y-4 flex-grow flex flex-col">
                    <FormField control={form.control} name="testName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>검사명</FormLabel>
                            <FormControl><Input placeholder="예: HTP 검사" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="testDate" render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>검사일</FormLabel>
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
                            <FormField control={form.control} name="testHour" render={({ field }) => (
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
                            <FormField control={form.control} name="testMinute" render={({ field }) => (
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
                     <FormField
                        control={form.control}
                        name="results"
                        render={({ field }) => (
                            <FormItem className="flex-grow flex flex-col">
                                <FormLabel>검사 결과</FormLabel>
                                <FormControl className="flex-grow">
                                    <Textarea
                                        placeholder="검사 결과를 입력하세요..."
                                        className="min-h-[40vh]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </div>
    );
}
