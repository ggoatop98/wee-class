
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { PsychologicalTest } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import PsychologicalTestForm from './PsychologicalTestForm';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface PsychologicalTestsClientProps {
    studentId: string;
    studentName: string;
}

export default function PsychologicalTestsClient({ studentId, studentName }: PsychologicalTestsClientProps) {
    const { user } = useAuth();
    const [tests, setTests] = useState<PsychologicalTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedTest, setSelectedTest] = useState<PsychologicalTest | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!studentId || !user) return;
        setLoading(true);
        const q = query(
            collection(db, "psychologicalTests"),
            where("studentId", "==", studentId),
            where("userId", "==", user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PsychologicalTest));
            testsData.sort((a, b) => {
                const dateComparison = b.testDate.localeCompare(a.testDate);
                if (dateComparison !== 0) return dateComparison;
                return (b.testTime || '').localeCompare(a.testTime || '');
            });
            setTests(testsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [studentId, user]);

    const handleAddNew = () => {
        setSelectedTest(null);
        setIsFormVisible(true);
    };

    const handleSelectTest = (test: PsychologicalTest) => {
        setSelectedTest(test);
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setSelectedTest(null);
    };

    const handleSave = async (data: { testName: string; testDate: string; testHour: string; testMinute: string; testDuration: number; results: string; }) => {
        if (!user) {
            toast({ variant: 'destructive', title: '오류', description: '로그인이 필요합니다.' });
            return;
        }

        const testData = {
            userId: user.uid,
            studentId,
            studentName,
            testName: data.testName,
            testDate: data.testDate,
            testTime: `${data.testHour}:${data.testMinute}`,
            testDuration: data.testDuration,
            results: data.results,
            updatedAt: Timestamp.now(),
        };

        try {
            if (selectedTest) {
                const docRef = doc(db, 'psychologicalTests', selectedTest.id);
                await setDoc(docRef, testData, { merge: true });
                toast({ title: '성공', description: '심리검사 결과가 수정되었습니다.' });
            } else {
                await addDoc(collection(db, 'psychologicalTests'), {
                    ...testData,
                    createdAt: Timestamp.now(),
                });
                toast({ title: '성공', description: '심리검사 결과가 저장되었습니다.' });
            }
            setIsFormVisible(false);
            setSelectedTest(null);
        } catch (error) {
            console.error('Error saving test: ', error);
            toast({ variant: 'destructive', title: '오류', description: '저장 중 오류가 발생했습니다.' });
        }
    };

    const handleDelete = async (testId: string) => {
        try {
            await deleteDoc(doc(db, "psychologicalTests", testId));
            toast({ title: "성공", description: "심리검사 결과가 삭제되었습니다." });
            if (selectedTest?.id === testId) {
                setIsFormVisible(false);
                setSelectedTest(null);
            }
        } catch (error) {
            console.error("Error deleting test: ", error);
            toast({ variant: "destructive", title: "오류", description: "삭제 중 오류가 발생했습니다." });
        }
    };
    
    if (isFormVisible) {
        return (
             <PsychologicalTestForm
                key={selectedTest ? selectedTest.id : 'new-test'}
                studentName={studentName}
                initialData={selectedTest}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div className="p-8">
            <PageHeader title={`${studentName} 심리검사 기록`}>
                 <div className="flex gap-2">
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        새로 작성
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        뒤로가기
                    </Button>
                </div>
            </PageHeader>
             <Card className="min-h-[70vh]">
                <CardHeader>
                    <CardTitle>검사 목록</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : tests.length === 0 ? (
                        <div className="flex items-center justify-center h-[60vh]">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-muted-foreground">심리검사 기록이 없습니다.</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    '새로 작성' 버튼을 눌러 검사 결과를 추가하세요.
                                </p>
                            </div>
                        </div>
                    ) : (
                         <ScrollArea className="h-[65vh]">
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>검사명</TableHead>
                                            <TableHead>검사일</TableHead>
                                            <TableHead>검사 시간</TableHead>
                                            <TableHead className="text-right">작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {tests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell className="font-medium">{test.testName}</TableCell>
                                            <TableCell>{new Date(test.testDate).toLocaleDateString('ko-KR')}</TableCell>
                                            <TableCell>{test.testTime || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleSelectTest(test)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                이 작업은 되돌릴 수 없습니다. 검사 결과가 영구적으로 삭제됩니다.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>취소</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(test.id)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
