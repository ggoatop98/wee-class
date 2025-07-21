
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Student } from "@/types";
import { addDays, addMonths, format } from 'date-fns';

import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import AppointmentList from "./AppointmentList";
import AppointmentForm from "./AppointmentForm";

export default function AppointmentsClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(appointmentsData);
      if(loading) setLoading(false);
    });
    
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsData);
    });

    return () => {
      unsubAppointments();
      unsubStudents();
    };
  }, [loading]);
  
  const allAppointmentsWithRepeats = useMemo(() => {
    const expandedAppointments: Appointment[] = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    appointments.forEach(app => {
      const originalDate = new Date(app.date);
      const tzOffset = originalDate.getTimezoneOffset() * 60000;
      const baseDate = new Date(originalDate.valueOf() + tzOffset);

      if (baseDate >= today) {
        expandedAppointments.push({
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
          
          if (nextDate >= today) {
            expandedAppointments.push({
                ...app,
                date: format(nextDate, 'yyyy-MM-dd'),
                id: `${app.id}-repeat-${i}`
            });
          }
        }
      }
    });

    expandedAppointments.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });

    return expandedAppointments;
  }, [appointments]);


  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    const originalId = appointment.id.split('-repeat-')[0];
    const originalAppointment = appointments.find(a => a.id === originalId);
    if (originalAppointment) {
      setSelectedAppointment(originalAppointment);
      setIsModalOpen(true);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const originalId = appointmentId.split('-repeat-')[0];
    try {
      await deleteDoc(doc(db, "appointments", originalId));
      toast({
        title: "성공",
        description: "일정 정보가 삭제되었습니다.",
      });
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
    <>
      <PageHeader title="일정 목록">
        <Button onClick={handleAddAppointment}>
          <PlusCircle className="mr-2 h-4 w-4" />
          추가
        </Button>
      </PageHeader>
      <AppointmentList
        appointments={allAppointmentsWithRepeats}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
        loading={loading}
      />
      <AppointmentForm
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment}
        students={students}
      />
    </>
  );
}
