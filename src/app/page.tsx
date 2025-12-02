
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarPlus, UserPlus, Pencil, Trash2 } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { collection, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student, Appointment } from '@/types';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { addDays, addMonths, format, isSameDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import TodoList from '@/components/dashboard/TodoList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

function HomePageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    const unsubStudents = onSnapshot(query(collection(db, "students"), where("userId", "==", user.uid)), (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsData);
    });
    
    const q = query(
      collection(db, "appointments"), 
      where("userId", "==", user.uid)
    );

    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAllAppointments(appointmentsData);
    });

    return () => {
      unsubStudents();
      unsubAppointments();
    };
  }, [user]);
  
  const parseDateWithTimezone = (dateString: string) => {
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.valueOf() + tzOffset);
  };

  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    allAppointments.forEach(app => {
      const originalDate = new Date(app.date);
      const tzOffset = originalDate.getTimezoneOffset() * 60000;
      const baseDate = new Date(originalDate.valueOf() + tzOffset);

      const dateKey = format(baseDate, 'yyyy-MM-dd');
      if (!(app.excludedDates || []).includes(dateKey)) {
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push({
          ...app,
          date: format(baseDate, 'yyyy-MM-dd')
        });
      }

      if (app.repeatSetting && app.repeatSetting !== '해당 없음' && app.repeatCount) {
        for (let i = 1; i < app.repeatCount; i++) {
          let nextDate: Date;
          if (app.repeatSetting === '매주') {
            nextDate = addDays(baseDate, i * 7);
          } else if (app.repeatSetting === '2주마다') {
            nextDate = addDays(baseDate, i * 14);
          } else if (app.repeatSetting === '매월') {
            nextDate = addMonths(baseDate, i);
          } else {
            continue;
          }
          
          const nextDateKey = format(nextDate, 'yyyy-MM-dd');
          if (!(app.excludedDates || []).includes(nextDateKey)) {
            if (!grouped[nextDateKey]) {
                grouped[nextDateKey] = [];
            }
            grouped[nextDateKey].push({
                ...app,
                date: nextDateKey,
                id: `${app.id}-repeat-${i}` 
            });
          }
        }
      }
    });

    // 정렬 추가
    for (const dateKey in grouped) {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    
    return grouped;
  }, [allAppointments]);

  const appointmentDates = useMemo(() => {
    return Object.keys(appointmentsByDate).map(dateStr => parseDateWithTimezone(dateStr));
  }, [appointmentsByDate]);


  const appointmentsToShow = useMemo(() => {
    if (selectedDate) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return appointmentsByDate[dateKey] || [];
    }
  
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayKey = format(today, 'yyyy-MM-dd');
    
    if (appointmentsByDate[todayKey] && appointmentsByDate[todayKey].length > 0) {
        return appointmentsByDate[todayKey];
    }

    const upcomingKeys = Object.keys(appointmentsByDate)
        .filter(dateKey => parseDateWithTimezone(dateKey) >= today)
        .sort();

    if (upcomingKeys.length > 0) {
        const nextDateKey = upcomingKeys[0];
        return appointmentsByDate[nextDateKey] || [];
    }
    
    return [];

  }, [selectedDate, appointmentsByDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if(date) {
      setCalendarDate(date);
    }
  };

  const getTitleForAppointmentsCard = () => {
    if (selectedDate) {
      return `${format(selectedDate, 'M월 d일')} 일정`;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayKey = format(today, 'yyyy-MM-dd');

    if (appointmentsByDate[todayKey] && appointmentsByDate[todayKey].length > 0) {
        return "오늘의 일정";
    }
    
    if (appointmentsToShow.length > 0) {
        const firstAppDate = parseDateWithTimezone(appointmentsToShow[0].date);
        return `${format(firstAppDate, 'M월 d일')} 일정`;
    }

    return "예정된 일정";
  };

  const handleEditAppointment = (appointment: Appointment) => {
    const originalId = appointment.id.split('-repeat-')[0];
    const originalAppointment = allAppointments.find(a => a.id === originalId);
    if (originalAppointment) {
      setSelectedAppointment(originalAppointment);
      setIsAppointmentModalOpen(true);
    }
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    const originalId = appointment.id.split('-repeat-')[0];
    const isRecurringInstance = appointment.id.includes('-repeat-');
    
    try {
      if (isRecurringInstance) {
        const appointmentRef = doc(db, "appointments", originalId);
        await updateDoc(appointmentRef, {
          excludedDates: arrayUnion(appointment.date)
        });
        toast({
          title: "성공",
          description: "선택한 반복 일정이 삭제되었습니다.",
        });
      } else {
        await deleteDoc(doc(db, "appointments", originalId));
        toast({
          title: "성공",
          description: "일정 정보가 삭제되었습니다.",
        });
      }
    } catch (error) {
      console.error("Error deleting appointment: ", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "일정 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <AppLayout>
      <main className="p-8">
        <PageHeader title="Student Counseling" />
        <div className="grid gap-8 md:grid-cols-3">
          
          <div className="space-y-8 md:col-span-1">
             <Card>
              <CardHeader>
                <CardTitle className="text-xl text-center">빠른 실행</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
                <Button onClick={() => { setSelectedAppointment(null); setIsAppointmentModalOpen(true); }} className="w-full sm:w-auto flex-grow">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  일정 추가
                </Button>
                <Button onClick={() => setIsStudentModalOpen(true)} className="w-full sm:w-auto flex-grow">
                  <UserPlus className="mr-2 h-4 w-4" />
                  내담자 추가
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{getTitleForAppointmentsCard()}</CardTitle>
                <CardDescription>
                    {selectedDate ? `선택한 날짜의 일정입니다.` : `다가오는 상담 및 기타 일정입니다.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[240px] pr-4">
                  <ul className="space-y-2">
                    {appointmentsToShow.length > 0 ? appointmentsToShow.map((app) => (
                        <li key={app.id} className="group flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                          <div className="flex-grow">
                            <p className="font-semibold">{`${app.studentName} - ${app.title}`}</p>
                            <p className="text-sm text-muted-foreground">{`${app.startTime}`}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditAppointment(app)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">수정</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
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
                                        <AlertDialogAction onClick={() => handleDeleteAppointment(app)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </li>
                    )) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center py-4">
                            {selectedDate ? '선택한 날짜에 일정이 없습니다.' : '예정된 일정이 없습니다.'}
                        </p>
                      </div>
                    )}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2 grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">캘린더</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="p-0"
                    month={calendarDate}
                    onMonthChange={setCalendarDate}
                    modifiers={{
                      scheduled: appointmentDates
                    }}
                    modifiersStyles={{
                      scheduled: { 
                        fontWeight: 'bold',
                        textDecoration: 'underline'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <TodoList />
            </div>
            
            <div className="md:col-span-2 pt-4">
              <p className="text-center text-muted-foreground font-headline text-2xl">여호와의 친밀하심이 그를 경외하는 자들에게 있음이여. 그의 언약을 그들에게 보이시리로다. (시25:14)</p>
            </div>
          </div>
        </div>
      </main>
      <StudentForm isOpen={isStudentModalOpen} onOpenChange={setIsStudentModalOpen} />
      <AppointmentForm isOpen={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} students={students} appointment={selectedAppointment} />
    </AppLayout>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}
