
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { CounselingLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CounselingLogForm from '@/components/records/CounselingLogForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';

interface RecordsClientProps {
    studentId: string;
    studentName: string;
}

export default function RecordsClient({ studentId, studentName }: RecordsClientProps) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<CounselingLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<CounselingLog | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!studentId || !user) return;
        setLoading(true);
        const q = query(
            collection(db, "counselingLogs"),
            where("studentId", "==", studentId),
            where("userId", "==", user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
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
        return () => unsubscribe();
    }, [studentId, user]);

    const handleAddNewLog = () => {
        setSelectedLog(null);
        setIsFormVisible(true);
    };

    const handleSelectLog = (log: CounselingLog) => {
        setSelectedLog(log);
        setIsFormVisible(true);
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
            if (selectedLog) {
                await setDoc(doc(db, 'counselingLogs', selectedLog.id), data, { merge: true });
                toast({ title: '성공', description: '상담일지가 수정되었습니다.' });
            } else {
                await addDoc(collection(db, 'counselingLogs'), { ...data, createdAt: Timestamp.now() });
                toast({ title: '성공', description: '새 상담일지가 저장되었습니다.' });
            }
            setIsFormVisible(false);
            setSelectedLog(null);
        } catch (error) {
            console.error('Error saving log: ', error);
            toast({ variant: 'destructive', title: '오류', description: '저장 중 오류가 발생했습니다.' });
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setSelectedLog(null);
    };

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
                                <ScrollArea className="h-[60vh]">
                                    <ul className="space-y-2">
                                        {logs.map((log) => (
                                            <li key={log.id} >
                                                <div
                                                    onClick={() => handleSelectLog(log)}
                                                    className={`p-4 rounded-lg cursor-pointer border ${selectedLog?.id === log.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                      <div>
                                                        <p className="font-semibold">{new Date(log.counselingDate).toLocaleDateString('ko-KR')} {log.counselingTime}</p>
                                                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">{log.mainIssues}</p>
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
                                                                <AlertDialogAction onClick={(e) =>{ e.stopPropagation(); handleDeleteLog(log.id)}} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
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
                            onSave={handleSaveLog}
                            onCancel={handleCancel}
                            log={selectedLog}
                        />
                    ) : (
                        <Card className="h-full flex items-center justify-center">
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
