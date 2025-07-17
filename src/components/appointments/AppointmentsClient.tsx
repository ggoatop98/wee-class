"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Student } from "@/types";

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
    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
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
  }, []);

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
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
        appointments={appointments}
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
