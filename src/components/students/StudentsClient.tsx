
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, doc, deleteDoc, query, updateDoc, where, getDocs, writeBatch, addDoc, Timestamp, orderBy } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import type { Student, StudentStatus, UploadedFile } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import StudentList from "./StudentList";
import StudentForm from "./StudentForm";
import FileUploadModal from "./FileUploadModal";
import { Input } from "@/components/ui/input";

export default function StudentsClient() {
  const { user } = useAuth();
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [selectedStudentForFiles, setSelectedStudentForFiles] = useState<Student | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    const q = query(collection(db, "students"), where("userId", "==", user.uid));
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
  }, [user]);

  const fetchFilesForStudent = useCallback(async (studentId: string) => {
    if (!user) return;
    setIsFetchingFiles(true);
    try {
        const filesCollectionRef = collection(db, "students", studentId, "files");
        const filesQuery = query(filesCollectionRef, orderBy("uploadedAt", "desc"));
        
        const unsubscribe = onSnapshot(filesQuery, (snapshot) => {
            const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UploadedFile));
            setUploadedFiles(filesData);
        }, (error) => {
            console.error("Error fetching files: ", error);
            toast({
                variant: "destructive",
                title: "오류",
                description: "파일 목록을 불러오는 중 오류가 발생했습니다.",
            });
        });
        
        // This is a simplified approach for modals. For long-running pages, you'd want to manage this unsubscribe function properly.
        // For the purpose of this modal, we'll let it be managed by the component lifecycle.
        
    } catch (error) {
        console.error("Error setting up file listener: ", error);
         toast({
            variant: "destructive",
            title: "오류",
            description: "파일 시스템에 연결하는 중 오류가 발생했습니다.",
        });
    } finally {
        setIsFetchingFiles(false);
    }
  }, [user, toast]);


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

  const handleUpdateStatus = async (studentId: string, status: StudentStatus) => {
    try {
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, { status });
      toast({
        title: "성공",
        description: "내담자 상태가 변경되었습니다.",
      });
    } catch (error) {
       console.error("Error updating student status: ", error);
       toast({
        variant: "destructive",
        title: "오류",
        description: "상태 변경 중 오류가 발생했습니다.",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);

        // Delete related documents from sub-collections or root collections
        const collectionsToDeleteFrom = ["counselingLogs", "caseConceptualizations", "psychologicalTests"];
        for (const coll of collectionsToDeleteFrom) {
            const q = query(collection(db, coll), where("studentId", "==", studentId), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        // Delete files from subcollection
        const filesCollectionRef = collection(db, "students", studentId, "files");
        const filesSnapshot = await getDocs(filesCollectionRef);
        filesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete files from storage
        const storageFolderRef = ref(storage, `student_files/${studentId}`);
        const res = await listAll(storageFolderRef);
        await Promise.all(res.items.map((itemRef) => deleteObject(itemRef)));

        // Delete the student document itself
        const studentRef = doc(db, "students", studentId);
        batch.delete(studentRef);

        await batch.commit();

        toast({
            title: "성공",
            description: "내담자 정보와 모든 관련 기록/파일이 삭제되었습니다.",
        });
    } catch (error) {
        console.error("Error deleting student and related data: ", error);
        toast({
            variant: "destructive",
            title: "오류",
            description: "내담자 정보 삭제 중 오류가 발생했습니다.",
        });
    }
  };
  
  const handleOpenFileUploadModal = (student: Student) => {
    setSelectedStudentForFiles(student);
    fetchFilesForStudent(student.id);
    setIsFileUploadModalOpen(true);
  };

  const handleUploadFile = async (file: File) => {
    if (!user || !selectedStudentForFiles) {
        toast({ variant: 'destructive', title: '오류', description: '업로드할 학생이 선택되지 않았습니다.' });
        return;
    }

    const storagePath = `student_files/${selectedStudentForFiles.id}/${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    toast({
        title: "업로드 중...",
        description: `${file.name} 파일을 업로드하고 있습니다.`,
    });

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Storing file metadata in a subcollection under the student
        const filesCollectionRef = collection(db, "students", selectedStudentForFiles.id, "files");
        const fileData: Omit<UploadedFile, 'id' | 'userId' | 'studentId'> = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            downloadURL,
            storagePath,
            uploadedAt: Timestamp.now(),
        };

        await addDoc(filesCollectionRef, fileData);

        toast({
            title: "업로드 성공",
            description: `${file.name} 파일이 성공적으로 업로드되었습니다.`,
        });
    } catch (error) {
        console.error("Error uploading file: ", error);
        toast({
            variant: "destructive",
            title: "업로드 오류",
            description: "파일 업로드 중 오류가 발생했습니다.",
        });
    }
  };

  const handleDeleteFile = async (fileToDelete: UploadedFile) => {
     if (!selectedStudentForFiles) return;

    const storageRef = ref(storage, fileToDelete.storagePath);
    try {
        // Delete file from storage
        await deleteObject(storageRef);

        // Delete firestore document from subcollection
        const fileDocRef = doc(db, "students", selectedStudentForFiles.id, "files", fileToDelete.id);
        await deleteDoc(fileDocRef);

        toast({
            title: "삭제 성공",
            description: `${fileToDelete.fileName} 파일이 삭제되었습니다.`,
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        toast({
            variant: "destructive",
            title: "삭제 오류",
            description: "파일 삭제 중 오류가 발생했습니다.",
        });
    }
  };


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
        onUpdateStatus={handleUpdateStatus}
        onOpenFileUploadModal={handleOpenFileUploadModal}
        loading={loading}
      />
      <StudentForm
        isOpen={isStudentModalOpen}
        onOpenChange={setIsStudentModalOpen}
        student={selectedStudent}
      />
       {selectedStudentForFiles && (
         <FileUploadModal
            isOpen={isFileUploadModalOpen}
            onOpenChange={setIsFileUploadModalOpen}
            student={selectedStudentForFiles}
            onUpload={handleUploadFile}
            onDelete={handleDeleteFile}
            files={uploadedFiles}
            isFetchingFiles={isFetchingFiles}
         />
       )}
    </>
  );
}
