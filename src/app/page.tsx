
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarPlus, UserPlus } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student, Appointment } from '@/types';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { addDays, addMonths, format, isSameDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

function HomePageContent() {
  const { user } = useAuth();
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, "appointments"), 
      where("userId", "==", user.uid)
    );

    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      
      appointmentsData.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });

      setAllAppointments(appointmentsData);
    });

    return () => {
      unsubStudents();
      unsubAppointments();
    };
  }, [user]);

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
        grouped[dateKey].push(app);
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
              date: nextDate.toISOString().split('T')[0],
              id: `${app.id}-repeat-${i}` 
            });
          }
        }
      }
    });
    return grouped;
  }, [allAppointments]);

  const appointmentDates = useMemo(() => {
    return Object.keys(appointmentsByDate).map(dateStr => {
        const date = new Date(dateStr);
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.valueOf() + tzOffset);
    });
  }, [appointmentsByDate]);


  const appointmentsToShow = useMemo(() => {
    if (selectedDate) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return appointmentsByDate[dateKey] || [];
    }

    if (allAppointments.length === 0) {
      return [];
    }
  
    const today = new Date();
    today.setHours(0,0,0,0);

    const upcomingAppointments = allAppointments.filter(app => {
        const appDate = new Date(app.date);
        const tzOffset = appDate.getTimezoneOffset() * 60000;
        return new Date(appDate.valueOf() + tzOffset) >= today && !(app.excludedDates || []).includes(format(new Date(appDate.valueOf() + tzOffset), 'yyyy-MM-dd'));
    });

    if (upcomingAppointments.length > 0) {
        const firstDate = upcomingAppointments[0].date;
        const dateKey = format(new Date(firstDate), 'yyyy-MM-dd');
        return appointmentsByDate[dateKey] || [];
    }
    
    return [];

  }, [allAppointments, selectedDate, appointmentsByDate]);

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

    const upcomingAppointments = allAppointments.filter(app => {
        const appDate = new Date(app.date);
        const tzOffset = appDate.getTimezoneOffset() * 60000;
        return new Date(appDate.valueOf() + tzOffset) >= today;
    });

    if (upcomingAppointments.length > 0) {
      const firstDate = new Date(upcomingAppointments[0].date);
       const tzOffset = firstDate.getTimezoneOffset() * 60000;
      if (isSameDay(new Date(firstDate.valueOf() + tzOffset), today)) {
        return "오늘의 일정";
      }
    }
    return "예정된 일정";
  };


  return (
    <AppLayout>
      <main className="p-8">
        <PageHeader title="Student Counseling" />
        <div className="grid gap-8 md:grid-cols-3">
          
          <div className="md:col-span-3">
             <Card>
              <CardHeader>
                <CardTitle>빠른 실행</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                <Button onClick={() => setIsAppointmentModalOpen(true)} className="w-full sm:w-auto">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  일정 추가
                </Button>
                <Button onClick={() => setIsStudentModalOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  내담자 추가
                </Button>
                <div className="text-2xl font-bold ml-auto pr-4">
                  (^_^)
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{getTitleForAppointmentsCard()}</CardTitle>
                <CardDescription>
                    {selectedDate ? `선택한 날짜의 일정입니다.` : `다가오는 상담 및 기타 일정입니다.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {appointmentsToShow.length > 0 ? appointmentsToShow.map((app) => (
                      <li key={app.id} className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                        <div>
                          <p className="font-semibold">{`${app.studentName} - ${app.title}`}</p>
                          <p className="text-sm text-muted-foreground">{new Date(app.date).toLocaleDateString('ko-KR', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })} {app.startTime}</p>
                        </div>
                      </li>
                  )) : (
                    <p className="text-muted-foreground text-center py-4">
                        {selectedDate ? '선택한 날짜에 일정이 없습니다.' : '예정된 일정이 없습니다.'}
                    </p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>캘린더</CardTitle>
                <CardDescription>이번 달 일정을 확인하세요.</CardDescription>
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

        </div>
      </main>
      <StudentForm isOpen={isStudentModalOpen} onOpenChange={setIsStudentModalOpen} />
      <AppointmentForm isOpen={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} students={students} />
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
