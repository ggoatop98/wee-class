"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types";

import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import StudentList from "./StudentList";
import StudentForm from "./StudentForm";
import CounselingLogForm from "../records/CounselingLogForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function StudentsClient() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [logStudent, setLogStudent] = useState<Student | null>(null);
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
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
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

  const handleAddLog = (student: Student) => {
    setLogStudent(student);
    setIsLogModalOpen(true);
  };

  const handleLogSaved = () => {
    setIsLogModalOpen(false);
    setLogStudent(null);
  }

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
        onAddLog={handleAddLog}
        loading={loading}
      />
      <StudentForm
        isOpen={isStudentModalOpen}
        onOpenChange={setIsStudentModalOpen}
        student={selectedStudent}
      />
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>새 상담일지 작성</DialogTitle>
            <DialogDescription>{logStudent?.name} 학생의 상담 내용을 기록합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <CounselingLogForm student={logStudent} onSave={handleLogSaved} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
