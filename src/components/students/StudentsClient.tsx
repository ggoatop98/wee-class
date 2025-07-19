
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types";

import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import StudentList from "./StudentList";
import StudentForm from "./StudentForm";
import { Input } from "@/components/ui/input";
import CounselingLogForm from "../records/CounselingLogForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export default function StudentsClient() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentForLog, setStudentForLog] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      studentsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setStudents(studentsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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
    setStudentForLog(student);
    setIsLogModalOpen(true);
  };

  const handleLogFormClose = () => {
    setIsLogModalOpen(false);
    setStudentForLog(null);
  }

  return (
    <>
      <PageHeader title="내담자 목록">
        <Input
          type="search"
          placeholder="이름으로 검색..."
          className="w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleAddStudent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          추가
        </Button>
      </PageHeader>
      <StudentList
        students={filteredStudents}
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
       {isLogModalOpen && studentForLog && (
        <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
            <DialogContent className="sm:max-w-[700px]">
                 <DialogHeader>
                    <DialogTitle>{studentForLog.name} 학생 상담일지 작성</DialogTitle>
                    <DialogDescription>새로운 상담 내용을 기록하세요.</DialogDescription>
                </DialogHeader>
                <CounselingLogForm 
                    student={studentForLog} 
                    onSave={handleLogFormClose}
                    onCancel={handleLogFormClose}
                />
            </DialogContent>
        </Dialog>
       )}
    </>
  );
}
