"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types";

import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import StudentList from "./StudentList";
import StudentForm from "./StudentForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

export default function StudentsClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteDoc(doc(db, "students", studentId));
      toast({
        title: "성공",
        description: "내담자 정보가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting student: ", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "내담자 정보 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <>
      <PageHeader title="내담자 목록">
        <Button onClick={handleAddStudent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          추가
        </Button>
      </PageHeader>
      <StudentList
        students={students}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        loading={loading}
      />
      <StudentForm
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        student={selectedStudent}
      />
    </>
  );
}
