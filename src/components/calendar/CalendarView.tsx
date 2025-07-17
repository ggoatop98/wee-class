"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment, Student } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import AppointmentForm from '../appointments/AppointmentForm';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(appointmentsData);
    });

    const studentUnsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    return () => {
      unsubscribe();
      studentUnsubscribe();
    }
  }, []);

  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = getDay(firstDayOfMonth);

  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    appointments.forEach(app => {
        const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(app);
    });
    return grouped;
  }, [appointments]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const colStartClasses = [
    '',
    'col-start-2',
    'col-start-3',
    'col-start-4',
    'col-start-5',
    'col-start-6',
    'col-start-7',
  ];

  return (
    <>
      <PageHeader title="캘린더">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{format(currentDate, 'yyyy년 M월')}</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              일정 추가
            </Button>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-7 gap-px mt-4 bg-border rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 col-span-7">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="py-2 text-center font-medium text-sm bg-card text-muted-foreground">{day}</div>
            ))}
        </div>
        
        <div className="grid grid-cols-7 col-span-7 gap-px">
        {[...Array(startingDayIndex)].map((_, i) => (
          <div key={`empty-${i}`} className="bg-muted/50"></div>
        ))}
        {daysInMonth.map((day, dayIdx) => (
          <div
            key={day.toString()}
            className={cn(
              'relative min-h-[120px] bg-card p-2',
            )}
          >
            <time
              dateTime={format(day, 'yyyy-MM-dd')}
              className={cn(
                'absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-sm',
                isToday(day) && 'bg-primary text-primary-foreground font-semibold',
                !isSameMonth(day, currentDate) && 'text-muted-foreground'
              )}
            >
              {format(day, 'd')}
            </time>
            <div className="mt-8 space-y-1">
                {(appointmentsByDate[format(day, 'yyyy-MM-dd')] || []).map(app => (
                    <div key={app.id} className="text-xs p-1 rounded-md bg-primary/20 hover:bg-primary/30 cursor-pointer overflow-hidden truncate">
                        <Badge variant="default" className="text-white bg-primary/80">{app.startTime}</Badge> {app.title}
                    </div>
                ))}
            </div>
          </div>
        ))}
        </div>
      </div>
      <AppointmentForm
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        students={students}
      />
    </>
  );
}
