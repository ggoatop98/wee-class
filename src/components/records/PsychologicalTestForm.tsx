
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PsychologicalTest } from '@/types';


const testSchema = z.object({
  testName: z.string().min(1, '검사명을 입력해주세요.'),
  testDate: z.date({ required_error: '검사일을 선택해주세요.' }),
  results: z.string().min(1, '검사 결과를 입력해주세요.'),
});

type TestFormValues = z.infer<typeof testSchema>;

interface PsychologicalTestFormProps {
    studentName: string;
    initialData: Partial<PsychologicalTest> | null;
    onSave: (data: TestFormValues) => void;
    onCancel: () => void;
}

export default function PsychologicalTestForm({ studentName, initialData, onSave, onCancel }: PsychologicalTestFormProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const form = useForm<TestFormValues>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            testName: '',
            testDate: new Date(),
            results: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                testName: initialData.testName || '',
                testDate: initialData.testDate ? parseISO(initialData.testDate) : new Date(),
                results: initialData.results || '',
            });
        } else {
            form.reset({
                testName: '',
                testDate: new Date(),
                results: '',
            });
        }
    }, [initialData, form]);

    const handleSaveClick = (data: TestFormValues) => {
        onSave(data);
    };

    const handleDateSelect = (selectedDate?: Date) => {
        if (selectedDate) {
          form.setValue('testDate', selectedDate, { shouldValidate: true });
          setIsCalendarOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-8">
             <PageHeader title={`${studentName} 심리검사 ${initialData?.id ? '수정' : '작성'}`}>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>취소</Button>
                    <Button type="submit" form="psychological-test-form">저장</Button>
                </div>
            </PageHeader>
            <Form {...form}>
                <form id="psychological-test-form" onSubmit={form.handleSubmit(handleSaveClick)} className="space-y-4 flex-grow flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="testName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>검사명</FormLabel>
                                <FormControl><Input placeholder="예: HTP 검사" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
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
