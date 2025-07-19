
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarPlus, UserPlus, ArrowRight } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student, Appointment } from '@/types';
import Link from 'next/link';

export default function Home() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsData);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const q = query(
      collection(db, "appointments"), 
      where("date", ">=", todayStr),
      orderBy("date")
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
  }, []);

  const appointmentsToShow = useMemo(() => {
    if (allAppointments.length === 0) {
      return [];
    }
  
    const uniqueDates = [...new Set(allAppointments.map(app => app.date))];
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const hasTodaysAppointments = uniqueDates.includes(todayStr);
  
    let datesToShow: string[] = [];

    if (hasTodaysAppointments) {
      // Find the next date after today
      const nextDate = uniqueDates.find(d => d > todayStr);
      datesToShow.push(todayStr);
      if (nextDate) {
        datesToShow.push(nextDate);
      } else if (uniqueDates.length === 1) {
        // if only today's appointments exist, show them
        datesToShow.push(todayStr);
      }
    } else {
      // If no appointments today, just show the next appointment day
      if (uniqueDates.length > 0) {
          datesToShow = uniqueDates.slice(0, 1);
      }
    }
  
    return allAppointments.filter(app => datesToShow.includes(app.date));
  }, [allAppointments]);

  let lastDate: string | null = null;


  return (
    <AppLayout>
      <main className="p-8">
        <PageHeader title="Home" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>빠른 실행</CardTitle>
              <CardDescription>자주 사용하는 기능을 빠르게 실행하세요.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setIsAppointmentModalOpen(true)} className="w-full sm:w-auto">
                <CalendarPlus className="mr-2 h-4 w-4" />
                일정 추가
              </Button>
              <Button onClick={() => setIsStudentModalOpen(true)} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                내담자 추가
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>예정된 일정</CardTitle>
              <CardDescription>다가오는 상담 및 기타 일정입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {appointmentsToShow.length > 0 ? appointmentsToShow.map((app, index) => {
                  const showSeparator = app.date !== lastDate && lastDate !== null;
                  lastDate = app.date;
                  return (
                    <React.Fragment key={app.id}>
                      {showSeparator && <Separator className="my-3" />}
                      <li className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                        <div>
                          <p className="font-semibold">{app.title}</p>
                          <p className="text-sm text-muted-foreground">{new Date(app.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} {app.startTime}</p>
                        </div>
                        <Link href="/schedule">
                          <Button variant="ghost" size="sm">
                            자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </li>
                    </React.Fragment>
                  );
                }) : (
                  <p className="text-muted-foreground text-center py-4">예정된 일정이 없습니다.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>공지사항</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                여름방학 중 상담실 운영 안내 및 2학기 상담 신청 기간에 대한 공지입니다. 자세한 내용은 내부 메신저를 확인해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <StudentForm isOpen={isStudentModalOpen} onOpenChange={setIsStudentModalOpen} />
      <AppointmentForm isOpen={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} students={students} />
    </AppLayout>
  );
}
