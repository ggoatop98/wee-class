
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths, isSameDay, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment, Student } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import AppointmentForm from '../appointments/AppointmentForm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function CalendarView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAllAppointments(appointmentsData);
    });

    const studentQuery = query(collection(db, "students"), where("userId", "==", user.uid));
    const studentUnsubscribe = onSnapshot(studentQuery, (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    return () => {
      unsubscribe();
      studentUnsubscribe();
    }
  }, [user]);

  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = getDay(firstDayOfMonth);

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
    return grouped;
  }, [allAppointments]);

  const handleEditAppointment = (appointment: Appointment) => {
    const originalId = appointment.id.split('-repeat-')[0];
    const originalAppointment = allAppointments.find(a => a.id === originalId);
    if (originalAppointment) {
      setSelectedAppointment(originalAppointment);
      setIsModalOpen(true);
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

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
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
            <Button onClick={() => { setSelectedAppointment(null); setIsModalOpen(true); }}>
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
        {daysInMonth.map((day) => (
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
                    <div key={app.id} className="group text-xs p-1 rounded-md bg-primary/20 hover:bg-primary/30 cursor-pointer overflow-hidden flex justify-between items-center">
                        <span className="truncate">
                          <Badge variant="default" className="text-white bg-primary/80 mr-1">{app.startTime}</Badge> 
                          {app.studentName}
                        </span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {e.stopPropagation(); handleEditAppointment(app);}}>
                              <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
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
        appointment={selectedAppointment}
      />
    </>
  );
}
