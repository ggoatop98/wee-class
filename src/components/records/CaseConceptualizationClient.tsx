
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { CaseConceptualization } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, PlusCircle } from 'lucide-react';
import CaseConceptualizationForm from './CaseConceptualizationForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CaseConceptualizationClientProps {
    studentId: string;
    studentName: string;
}

export default function CaseConceptualizationClient({ studentId, studentName }: CaseConceptualizationClientProps) {
    const [conceptualization, setConceptualization] = useState<CaseConceptualization | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        const q = query(
            collection(db, "caseConceptualizations"),
            where("studentId", "==", studentId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data() as CaseConceptualization;
                setConceptualization({ id: snapshot.docs[0].id, ...data });
            } else {
                setConceptualization(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [studentId]);

    const handleSave = async (content: string) => {
        try {
            if (conceptualization) {
                // Update existing
                const docRef = doc(db, 'caseConceptualizations', conceptualization.id);
                await setDoc(docRef, { content, updatedAt: Timestamp.now() }, { merge: true });
                toast({ title: '성공', description: '사례개념화가 수정되었습니다.' });
            } else {
                // Create new
                await addDoc(collection(db, 'caseConceptualizations'), {
                    studentId,
                    studentName,
                    content,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
                toast({ title: '성공', description: '사례개념화가 저장되었습니다.' });
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving conceptualization: ', error);
            toast({ variant: 'destructive', title: '오류', description: '저장 중 오류가 발생했습니다.' });
        }
    };

    const handleDelete = async () => {
        if (!conceptualization) return;
        try {
            await deleteDoc(doc(db, "caseConceptualizations", conceptualization.id));
            toast({ title: "성공", description: "사례개념화가 삭제되었습니다." });
            setConceptualization(null);
            setIsEditing(false);
        } catch (error) {
            console.error("Error deleting conceptualization: ", error);
            toast({ variant: "destructive", title: "오류", description: "삭제 중 오류가 발생했습니다." });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isEditing) {
        return (
            <CaseConceptualizationForm
                studentName={studentName}
                initialContent={conceptualization?.content || ''}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    return (
        <>
            <PageHeader title={`${studentName} 사례개념화`}>
                {conceptualization ? (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    삭제
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        이 작업은 되돌릴 수 없습니다. 사례개념화 내용이 영구적으로 삭제됩니다.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : (
                    <Button onClick={() => setIsEditing(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        새로 작성
                    </Button>
                )}
            </PageHeader>
            <Card className="min-h-[60vh]">
                <CardContent className="p-6">
                    {conceptualization ? (
                        <div className="prose max-w-none whitespace-pre-wrap text-base">
                            {conceptualization.content}
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-[60vh]">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-muted-foreground">사례개념화 내용이 없습니다.</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    우측 상단의 '새로 작성' 버튼을 눌러 새로운 내용을 추가하세요.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
