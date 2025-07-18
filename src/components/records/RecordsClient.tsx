
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student, CounselingLog } from '@/types';

import { PageHeader } from '../PageHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import CounselingLogForm from './CounselingLogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';

export default function RecordsClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [allLogs, setAllLogs] = useState<CounselingLog[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<CounselingLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const initialStudentId = searchParams.get('studentId');
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      const student = students.find(s => s.id === initialStudentId);
      if (student) {
        setSearchTerm(student.name);
      }
    }
  }, [searchParams, students]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    const logsQuery = query(collection(db, "counselingLogs"), orderBy("counselingDate", "desc"), orderBy("counselingTime", "desc"));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        const allLogsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingLog));
        setAllLogs(allLogsData);
        setLoading(false);
    });

    return () => {
        unsubStudents();
        unsubLogs();
    };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setCounselingLogs([]);
      return;
    }
    const studentLogs = allLogs
      .filter(log => log.studentId === selectedStudentId)
      .sort((a, b) => {
        const dateA = new Date(`${a.counselingDate}T${a.counselingTime}`).getTime();
        const dateB = new Date(`${b.counselingDate}T${b.counselingTime}`).getTime();
        return dateB - dateA;
      });
    setCounselingLogs(studentLogs);
  }, [selectedStudentId, allLogs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [students, searchTerm]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student.id);
    setSelectedLog(null);
    setSearchTerm(student.name);
    setIsSearchFocused(false);
  };
  
  const handleLogSelect = (log: CounselingLog) => {
    setSelectedLog(log);
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
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
        setSelectedStudentId(null);
        setSelectedLog(null);
    }
  }

  const getStudentInfo = (studentId: string) => {
    return students.find(s => s.id === studentId);
  }

  return (
    <>
      <PageHeader title="상담 일지" centered>
        <div className="relative w-full max-w-sm" ref={searchContainerRef}>
          <Input
            type="search"
            placeholder="내담자 이름 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full"
          />
          {isSearchFocused && filteredStudents.length > 0 && (
            <Card className="absolute z-10 mt-1 w-full bg-background shadow-lg">
              <CardContent className="p-2">
                <ul>
                  {filteredStudents.map(student => (
                    <li
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className="cursor-pointer rounded-md p-2 hover:bg-accent"
                    >
                      {student.name} ({student.class})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </PageHeader>
      
      {!selectedStudentId ? (
         <Card>
            <CardHeader>
                <CardTitle>최근 상담 기록</CardTitle>
                <CardDescription>모든 내담자의 최근 상담 기록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>상담일자</TableHead>
                            <TableHead>내담자</TableHead>
                            <TableHead>학반</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                </TableRow>
                            ))
                        ) : allLogs.length > 0 ? allLogs.map(log => {
                            const student = getStudentInfo(log.studentId);
                            return (
                                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => student && handleStudentSelect(student)}>
                                    <TableCell>{log.counselingDate} {log.counselingTime}</TableCell>
                                    <TableCell>{student?.name || "알 수 없음"}</TableCell>
                                    <TableCell>{student?.class || "-"}</TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    상담 기록이 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-12 gap-8 mt-8">
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
                                          className={cn(`group p-3 rounded-lg cursor-pointer transition-colors`, selectedLog?.id === log.id ? 'bg-primary/20' : 'hover:bg-muted/80')}
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
