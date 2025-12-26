

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Loader2, Trash2, ArrowLeft, Printer } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { CounselingLog, Student } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import truncate from 'truncate';
import { format } from 'date-fns';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CounselingLogForm from '@/components/records/CounselingLogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface RecordsClientProps {
    studentId: string;
    studentName: string;
}

export default function RecordsClient({ studentId, studentName }: RecordsClientProps) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<CounselingLog[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<CounselingLog | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    const currentStudent = students.find(s => s.id === studentId);
    const previousLog = isFormVisible && !selectedLog && logs.length > 0 ? logs[0] : null;

    useEffect(() => {
        if (!studentId || !user?.uid) {
            setLoading(false);
            setLogs([]);
            setStudents([]);
            return;
        }
        setLoading(true);

        const logsQuery = query(
            collection(db, "counselingLogs"),
            where("studentId", "==", studentId),
            where("userId", "==", user.uid)
        );
        const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingLog));
            
            logsData.sort((a, b) => {
                if (a.counselingDate > b.counselingDate) return -1;
                if (a.counselingDate < b.counselingDate) return 1;
                if (a.counselingTime > b.counselingTime) return -1;
                if (a.counselingTime < b.counselingTime) return 1;
                return 0;
            });

            setLogs(logsData);
            setLoading(false);
        });
        
        const studentsQuery = query(collection(db, "students"), where("userId", "==", user.uid));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
        });

        return () => {
            unsubLogs();
            unsubStudents();
        };
    }, [studentId, user?.uid]);

    const handleAddNewLog = () => {
        setSelectedLog(null);
        setIsFormVisible(true);
    };

    const handleSelectLog = (log: CounselingLog) => {
        setSelectedLog(log);
        setIsFormVisible(false); // Make sure form is not visible when just selecting
    };

    const handleDeleteLog = async (logId: string) => {
        try {
            await deleteDoc(doc(db, "counselingLogs", logId));
            toast({ title: "성공", description: "상담일지가 삭제되었습니다." });
            if (selectedLog?.id === logId) {
                setIsFormVisible(false);
                setSelectedLog(null);
            }
        } catch (error) {
            console.error("Error deleting log: ", error);
            toast({ variant: "destructive", title: "오류", description: "삭제 중 오류가 발생했습니다." });
        }
    };

    const handleSaveLog = async (data: Omit<CounselingLog, 'id'>) => {
        try {
            const dataToSave = { 
                ...data, 
                counselingMethod: data.counselingMethod || '면담',
                isAdvisory: data.isAdvisory || false,
                isParentCounseling: data.isParentCounseling || false,
                advisoryField: data.isAdvisory ? (data.advisoryField || '기타') : '',
                counselingDivision: data.counselingDivision,
                coCounselees: data.coCounselees || [],
            };

            if (selectedLog && isFormVisible) { // Check if we are in edit mode
                await setDoc(doc(db, 'counselingLogs', selectedLog.id), dataToSave, { merge: true });
                toast({ title: '성공', description: '상담일지가 수정되었습니다.' });
            } else {
                await addDoc(collection(db, 'counselingLogs'), { ...dataToSave, createdAt: Timestamp.now() });
                toast({ title: '성공', description: '새 상담일지가 저장되었습니다.' });
            }
            setIsFormVisible(false);
            // After saving, re-select the log to show its content
            // This needs to be handled carefully, maybe by fetching the newly created/updated log
        } catch (error) {
            console.error('Error saving log: ', error);
            toast({ variant: 'destructive', title: '오류', description: '저장 중 오류가 발생했습니다.' });
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
    };

    const handlePrint = () => {
        if (!selectedLog) return;
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 30px; margin: 0 auto; max-width: 800px;">
                <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">상담 일지</h1>
                <div style="border: 1px solid #ccc; padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">내담자명</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${selectedLog.studentName}</td>
                                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">상담일시</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${format(new Date(selectedLog.counselingDate), "yyyy-MM-dd")} ${selectedLog.counselingTime} (${selectedLog.counselingDuration}분)</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">상담 내용</h2>
                        <div style="min-height: 200px; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${selectedLog.mainIssues.replace(/\n/g, '<br />')}</div>
                    </div>
                    <div>
                        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">상담 의견</h2>
                        <div style="min-height: 200px; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${(selectedLog.therapistComments || '').replace(/\n/g, '<br />')}</div>
                    </div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>상담일지 인쇄</title>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        } else {
            alert('팝업 차단으로 인해 인쇄 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
        }
    }


    return (
        <>
            <PageHeader title={`${studentName} 상담 기록`}>
                <div className="flex gap-2">
                    <Button onClick={handleAddNewLog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        새 상담일지 추가
                    </Button>
                    <Link href="/students">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            나가기
                        </Button>
                    </Link>
                </div>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>상담 이력</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : logs.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">상담 기록이 없습니다.</p>
                            ) : (
                                <ScrollArea className="h-[70vh]">
                                    <ul className="space-y-2">
                                        {logs.map((log) => (
                                            <li key={log.id} >
                                                <div
                                                    onClick={() => handleSelectLog(log)}
                                                    className={`p-4 rounded-lg cursor-pointer border ${selectedLog?.id === log.id && !isFormVisible ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                      <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <p className="font-semibold">{new Date(log.counselingDate).toLocaleDateString('ko-KR')} {log.counselingTime}</p>
                                                          {log.isAdvisory && <Badge variant="outline">자문</Badge>}
                                                          {log.isParentCounseling && <Badge variant="destructive">학부모</Badge>}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{truncate(log.mainIssues, 20)}</p>
                                                      </div>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                 <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                     <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                이 작업은 되돌릴 수 없습니다. 상담일지 정보가 영구적으로 삭제됩니다.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>취소</AlertDialogCancel>
                                                                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    {isFormVisible ? (
                        <CounselingLogForm
                            studentId={studentId}
                            studentName={studentName}
                            currentStudent={currentStudent}
                            allStudents={students}
                            onSave={handleSaveLog}
                            onCancel={handleCancel}
                            log={selectedLog} // Pass selectedLog to edit
                            previousLog={previousLog}
                        />
                    ) : selectedLog ? (
                         <Card className="min-h-[70vh]">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{new Date(selectedLog.counselingDate).toLocaleDateString('ko-KR')} 상담일지</CardTitle>
                                        <CardDescription className="pt-1">
                                            {selectedLog.counselingTime} ({selectedLog.counselingDuration || 'N/A'}분) / {selectedLog.counselingMethod}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={handlePrint}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            인쇄
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsFormVisible(true)}>수정하기</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">주요 내용</h3>
                                    <div className="prose prose-lg max-w-none p-4 border rounded-md min-h-[20vh] whitespace-pre-wrap">{selectedLog.mainIssues}</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">상담 의견</h3>
                                    <div className="prose prose-lg max-w-none p-4 border rounded-md min-h-[20vh] whitespace-pre-wrap">{selectedLog.therapistComments}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full flex items-center justify-center min-h-[70vh]">
                            <CardContent className="text-center">
                                <h3 className="text-lg font-medium text-muted-foreground">상담일지를 선택하거나 새 일지를 추가하세요.</h3>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
