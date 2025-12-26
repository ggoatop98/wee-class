

"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CounselingLog, Student, CoCounselee, CounselingDivision } from '@/types';
import { format, parse } from 'date-fns';
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
import { Calendar as CalendarIcon, Printer, UserPlus, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const counselingDivisions: [CounselingDivision, ...CounselingDivision[]] = ['진로', '성격', '대인관계', '가정 및 가족관계', '일탈 및 비행', '학교폭력 가해', '학교폭력 피해', '자해 및 자살', '정신건강', '컴퓨터 및 스마트폰 과사용', '정보제공', '기타'];


const logSchema = z.object({
  counselingDate: z.date({ required_error: '날짜를 선택해주세요.' }),
  counselingHour: z.string().min(1, '시간을 선택해주세요.'),
  counselingMinute: z.string().min(1, '분을 선택해주세요.'),
  counselingDuration: z.coerce.number().optional(),
  counselingMethod: z.enum(['면담', '전화상담', '사이버상담']).optional(),
  isAdvisory: z.boolean().optional(),
  isParentCounseling: z.boolean().optional(),
  advisoryField: z.enum(['학교학습', '사회성발달', '정서발달', '진로발달', '행동발달', '기타']).optional(),
  counselingDivision: z.string().optional(),
  mainIssues: z.string().min(1, '상담 내용을 입력해주세요.'),
  therapistComments: z.string().optional(),
  counselingGoals: z.string().optional(),
  sessionContent: z.string().optional(),
  nextSessionGoals: z.string().optional(),
  coCounselees: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

interface CounselingLogFormProps {
  studentId: string;
  studentName: string;
  currentStudent?: Student;
  allStudents: Student[];
  log: CounselingLog | null;
  previousLog: CounselingLog | null;
  onSave: (data: Omit<CounselingLog, 'id'>) => void;
  onCancel: () => void;
}

export default function CounselingLogForm({ studentId, studentName, currentStudent, allStudents, log, previousLog, onSave, onCancel }: CounselingLogFormProps) {
    const { user } = useAuth();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
    
    const form = useForm<LogFormValues>({
        resolver: zodResolver(logSchema),
        defaultValues: {
            counselingDate: new Date(),
            counselingHour: '13',
            counselingMinute: '00',
            counselingDuration: 40,
            counselingMethod: '면담',
            isAdvisory: false,
            isParentCounseling: false,
            advisoryField: '기타',
            counselingDivision: previousLog?.counselingDivision || '기타',
            mainIssues: '',
            therapistComments: '',
            counselingGoals: '',
            sessionContent: '',
            nextSessionGoals: '',
            coCounselees: [],
        },
    });

    const isAdvisory = useWatch({ control: form.control, name: 'isAdvisory' });
    const coCounselees = useWatch({ control: form.control, name: 'coCounselees' }) || [];

    useEffect(() => {
        if (log) {
            const [hour, minute] = log.counselingTime ? log.counselingTime.split(':') : ['13', '00'];
            
            let logDate;
            try {
                // The date is 'yyyy-MM-dd'. We need to parse it correctly, assuming local timezone.
                // Creating a new Date directly from this string can cause timezone issues.
                logDate = parse(log.counselingDate, 'yyyy-MM-dd', new Date());
            } catch(e) {
                logDate = new Date();
            }

            form.reset({
                counselingDate: logDate,
                counselingHour: hour,
                counselingMinute: minute,
                counselingDuration: log.counselingDuration || 40,
                counselingMethod: log.counselingMethod || '면담',
                isAdvisory: log.isAdvisory || false,
                isParentCounseling: log.isParentCounseling || false,
                advisoryField: log.advisoryField || '기타',
                counselingDivision: log.counselingDivision || '기타',
                mainIssues: log.mainIssues || '',
                therapistComments: log.therapistComments || '',
                counselingGoals: log.counselingGoals || '',
                sessionContent: log.sessionContent || '',
                nextSessionGoals: log.nextSessionGoals || '',
                coCounselees: log.coCounselees || [],
            });
        } else {
            form.reset({
                counselingDate: new Date(),
                counselingHour: '13',
                counselingMinute: '00',
                counselingDuration: 40,
                counselingMethod: '면담',
                isAdvisory: false,
                isParentCounseling: false,
                advisoryField: '기타',
                counselingDivision: previousLog?.counselingDivision || '기타',
                mainIssues: '',
                therapistComments: '',
                counselingGoals: '',
                sessionContent: '',
                nextSessionGoals: '',
                coCounselees: [],
            });
        }
    }, [log, previousLog, form]);

    const sameGradeStudents = useMemo(() => {
        if (!currentStudent) return [];
        const currentGrade = currentStudent.class.split('-')[0];
        const addedCounseleeIds = new Set([studentId, ...coCounselees.map(c => c.id)]);

        return allStudents
            .filter(s => s.class.startsWith(`${currentGrade}-`) && !addedCounseleeIds.has(s.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }, [currentStudent, allStudents, studentId, coCounselees]);


    const onSubmit = (data: LogFormValues) => {
        if (!user) return;

        const submissionData = {
            userId: user.uid,
            studentId,
            studentName,
            counselingDate: format(data.counselingDate, 'yyyy-MM-dd'),
            counselingTime: `${data.counselingHour}:${data.counselingMinute}`,
            counselingDuration: data.counselingDuration,
            counselingMethod: data.counselingMethod,
            isAdvisory: data.isAdvisory,
            isParentCounseling: data.isParentCounseling,
            advisoryField: data.advisoryField,
            counselingDivision: data.counselingDivision as CounselingDivision,
            mainIssues: data.mainIssues,
            therapistComments: data.therapistComments || '',
            counselingGoals: data.counselingGoals || '',
            sessionContent: data.sessionContent || '',
            nextSessionGoals: data.nextSessionGoals || '',
            createdAt: log?.createdAt || new Date(),
            coCounselees: data.coCounselees || [],
        };
        onSave(submissionData);
    };
    
    const handleDateSelect = (selectedDate?: Date) => {
        if (selectedDate) {
          form.setValue('counselingDate', selectedDate, { shouldValidate: true });
          setIsCalendarOpen(false);
        }
    };

    const addCoCounselee = (student: Student) => {
        const newCoCounselees = [...coCounselees, { id: student.id, name: student.name }];
        form.setValue('coCounselees', newCoCounselees);
        setIsStudentSelectOpen(false);
    };

    const removeCoCounselee = (studentId: string) => {
        const newCoCounselees = coCounselees.filter(s => s.id !== studentId);
        form.setValue('coCounselees', newCoCounselees);
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
                                <td style="border: 1px solid #ccc; padding: 8px;">${format(data.counselingDate, "yyyy-MM-dd")} ${data.counselingHour}:${data.counselingMinute} (${data.counselingDuration}분)</td>
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow flex flex-col">
                        <div className="flex-grow space-y-4 overflow-auto p-1">
                             <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
                                  <Input 
                                      readOnly 
                                      value={[studentName, ...coCounselees.map(s => s.name)].join(', ')} 
                                      className="text-center font-semibold text-lg pr-8" 
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                      {coCounselees.map((s, index) => (
                                          <button 
                                              key={s.id} 
                                              type="button" 
                                              onClick={() => removeCoCounselee(s.id)}
                                              className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring"
                                          >
                                              <XCircle className="h-4 w-4" />
                                          </button>
                                      ))}
                                  </div>
                                </div>

                                <Popover open={isStudentSelectOpen} onOpenChange={setIsStudentSelectOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" size="sm">
                                            <UserPlus className="mr-2 h-4 w-4" /> 내담자 추가
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[200px]" align="start">
                                        <Command>
                                            <CommandInput placeholder="학생 이름 검색..." />
                                            <CommandList>
                                                <CommandEmpty>결과 없음.</CommandEmpty>
                                                <CommandGroup>
                                                    {sameGradeStudents.map(s => (
                                                        <CommandItem
                                                            key={s.id}
                                                            value={s.name}
                                                            onSelect={() => addCoCounselee(s)}
                                                        >
                                                            {s.name} ({s.class})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="text-right pr-2">
                                    <span className="text-sm text-muted-foreground">총 {1 + coCounselees.length}명</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <FormField control={form.control} name="counselingDate" render={({ field }) => (
                                        <FormItem className="flex flex-col justify-end">
                                            <FormLabel className="text-center">상담 날짜</FormLabel>
                                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn("w-full pl-3 text-left font-normal justify-start", !field.value && "text-muted-foreground")}
                                                    >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP", { locale: ko }) : <span>날짜 선택</span>}
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
                                <div className="md:col-span-2 grid grid-cols-4 gap-2">
                                    <FormField control={form.control} name="counselingHour" render={({ field }) => (
                                        <FormItem><FormLabel className="text-center">시간</FormLabel>
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
                                        <FormItem><FormLabel className="text-center">분</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                                            <SelectValue placeholder="분" />
                                        </SelectTrigger></FormControl><SelectContent>
                                            {['00', '10', '20', '30', '40', '50'].map(min => (
                                                <SelectItem key={min} value={min}>{min}</SelectItem>
                                            ))}
                                        </SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="counselingDuration" render={({ field }) => (
                                        <FormItem><FormLabel className="text-center">진행시간</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value ?? '40')}><FormControl><SelectTrigger>
                                            <SelectValue placeholder="분" />
                                        </SelectTrigger></FormControl><SelectContent>
                                            {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map(min => (
                                                <SelectItem key={min} value={String(min)}>{min}분</SelectItem>
                                            ))}
                                        </SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="counselingMethod" render={({ field }) => (
                                        <FormItem><FormLabel className="text-center">방식</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? '면담'}><FormControl><SelectTrigger>
                                            <SelectValue placeholder="방식" />
                                        </SelectTrigger></FormControl><SelectContent>
                                            <SelectItem value="면담">면담</SelectItem>
                                            <SelectItem value="전화상담">전화상담</SelectItem>
                                            <SelectItem value="사이버상담">사이버상담</SelectItem>
                                        </SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </div>
                            <FormField control={form.control} name="mainIssues" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-4">
                                        <FormLabel>상담 내용</FormLabel>
                                        {!isAdvisory && (
                                            <FormField control={form.control} name="counselingDivision" render={({ field: divisionField }) => (
                                                <FormItem className="w-48"><Select onValueChange={divisionField.onChange} value={divisionField.value}><FormControl><SelectTrigger>
                                                    <SelectValue placeholder="상담 구분" />
                                                </SelectTrigger></FormControl><SelectContent>
                                                    {counselingDivisions.map(division => (
                                                        <SelectItem key={division} value={division}>{division}</SelectItem>
                                                    ))}
                                                </SelectContent></Select></FormItem>
                                            )}/>
                                        )}
                                        <FormField
                                            control={form.control}
                                            name="isAdvisory"
                                            render={({ field: advisoryField }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={advisoryField.value}
                                                            onCheckedChange={advisoryField.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">자문</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="isParentCounseling"
                                            render={({ field: parentField }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={parentField.value}
                                                            onCheckedChange={parentField.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">학부모상담</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                         {isAdvisory && (
                                            <FormField control={form.control} name="advisoryField" render={({ field }) => (
                                                <FormItem className="w-48"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                                                    <SelectValue placeholder="자문 분야" />
                                                </SelectTrigger></FormControl><SelectContent>
                                                    <SelectItem value="학교학습">학교학습</SelectItem>
                                                    <SelectItem value="사회성발달">사회성발달</SelectItem>
                                                    <SelectItem value="정서발달">정서발달</SelectItem>
                                                    <SelectItem value="진로발달">진로발달</SelectItem>
                                                    <SelectItem value="행동발달">행동발달</SelectItem>
                                                    <SelectItem value="기타">기타</SelectItem>
                                                </SelectContent></Select></FormItem>
                                            )}/>
                                        )}
                                    </div>
                                    <FormControl><Textarea placeholder="상담 내용을 요약하여 기록하세요." {...field} rows={8} className="text-lg" /></FormControl><FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="therapistComments" render={({ field }) => (
                                <FormItem><FormLabel>상담 의견</FormLabel><FormControl><Textarea placeholder="상담 내용에 대한 의견을 기록하세요." {...field} rows={8} className="text-lg" /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={handlePrint}>
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

    
    
