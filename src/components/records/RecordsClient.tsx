
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student, CounselingLog } from '@/types';

import { PageHeader } from '../PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import CounselingLogForm from './CounselingLogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

export default function RecordsClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [allCounselingLogs, setAllCounselingLogs] = useState<CounselingLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<CounselingLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialStudentId = searchParams.get('studentId');
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setLoading(false);
    });

    const unsubLogs = onSnapshot(collection(db, "counselingLogs"), (snapshot) => {
      setAllCounselingLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingLog)));
    });

    return () => {
      unsubStudents();
      unsubLogs();
    }
  }, []);

  const sortedStudentsForDropdown = useMemo(() => {
    const lastLogDateMap = new Map<string, string>();
    allCounselingLogs.forEach(log => {
      const existingDate = lastLogDateMap.get(log.studentId);
      if (!existingDate || new Date(log.counselingDate) > new Date(existingDate)) {
        lastLogDateMap.set(log.studentId, log.counselingDate);
      }
    });

    const sorted = [...students]
      .sort((a, b) => {
        const dateA = lastLogDateMap.get(a.id) ? new Date(lastLogDateMap.get(a.id)!).getTime() : 0;
        const dateB = lastLogDateMap.get(b.id) ? new Date(lastLogDateMap.get(b.id)!).getTime() : 0;
        return dateB - dateA;
      });

    return sorted.slice(0, 10);
  }, [students, allCounselingLogs]);

  const counselingLogs = useMemo(() => {
    if (!selectedStudentId) return [];
    return allCounselingLogs
      .filter(log => log.studentId === selectedStudentId)
      .sort((a, b) => {
        const dateA = new Date(`${a.counselingDate}T${a.counselingTime}`).getTime();
        const dateB = new Date(`${b.counselingDate}T${b.counselingTime}`).getTime();
        return dateB - dateA;
      });
  }, [selectedStudentId, allCounselingLogs]);


  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedLog(null);
  };
  
  const handleLogSelect = (log: CounselingLog) => {
    setSelectedLog(log);
  };
  
  const handleAddNewLog = () => {
    setSelectedLog(null);
  };

  const handleDeleteLog = async (logId: string) => {
     try {
      await deleteDoc(doc(db, "counselingLogs", logId));
      toast({
        title: "성공",
        description: "상담일지가 삭제되었습니다.",
      });
      if(selectedLog?.id === logId) {
        setSelectedLog(null);
      }
    } catch (error) {
      console.error("Error deleting log: ", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "상담일지 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <>
      <PageHeader title="상담 일지 상세">
        <div className="w-[250px]">
          <Select onValueChange={handleStudentChange} value={selectedStudentId || ""}>
            <SelectTrigger id="student-selector">
              <SelectValue placeholder="내담자 선택..." />
            </SelectTrigger>
            <SelectContent>
              {sortedStudentsForDropdown.map(student => (
                <SelectItem key={student.id} value={student.id}>{student.name} ({student.class})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      
      {!selectedStudentId ? (
        <Card className="flex items-center justify-center h-96">
            <CardContent className="text-center">
                <p className="text-muted-foreground">상단에서 내담자를 선택해주세요.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle>상담 이력</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] mt-4">
                            <ul className="space-y-2 pr-4">
                                {counselingLogs.length > 0 ? counselingLogs.map(log => (
                                    <li key={log.id}>
                                        <div 
                                          onClick={() => handleLogSelect(log)}
                                          className={`group p-3 rounded-lg cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'bg-primary/20' : 'hover:bg-muted/80'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="text-base font-bold text-foreground">{new Date(log.counselingDate).toLocaleDateString()} {log.counselingTime}</p>
                                                </div>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle><AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                                      <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </li>
                                )) : <p className="text-center text-muted-foreground py-8">상담 기록이 없습니다.</p>}
                            </ul>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-8">
                <CounselingLogForm student={selectedStudent} log={selectedLog} onSave={() => setSelectedLog(null)} />
            </div>
        </div>
      )}
    </>
  );
}
