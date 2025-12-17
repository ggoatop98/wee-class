
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { CaseConceptualization } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, PlusCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ApplicationForm from './ApplicationForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CaseConceptualizationClientProps {
    studentId: string;
    studentName: string;
}

export default function CaseConceptualizationClient({ studentId, studentName }: CaseConceptualizationClientProps) {
    const { user } = useAuth();
    const [conceptualization, setConceptualization] = useState<CaseConceptualization | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const formTitle = "사례개념화";
    const collectionName = "caseConceptualizations";


    useEffect(() => {
        if (!studentId || !user?.uid) {
            setLoading(false);
            setConceptualization(null);
            return;
        }
        setLoading(true);
        const q = query(
            collection(db, collectionName),
            where("studentId", "==", studentId),
            where("userId", "==", user.uid)
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
    }, [studentId, user?.uid]);

    const handleSave = async (content: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: '오류', description: '로그인이 필요합니다.' });
            return;
        }

        try {
            if (conceptualization) {
                // Update existing
                const docRef = doc(db, collectionName, conceptualization.id);
                await setDoc(docRef, { content, updatedAt: Timestamp.now() }, { merge: true });
                toast({ title: '성공', description: '사례개념화가 수정되었습니다.' });
            } else {
                // Create new
                await addDoc(collection(db, collectionName), {
                    userId: user.uid,
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
            await deleteDoc(doc(db, collectionName, conceptualization.id));
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
            <div className="flex items-center justify-center h-64 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isEditing || !conceptualization) {
        return (
            <ApplicationForm
                formTitle={formTitle}
                studentName={studentName}
                initialContent={conceptualization?.content || ''}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                handleDelete={conceptualization ? handleDelete : undefined}
            />
        );
    }

    return (
        <div className="p-8">
            <PageHeader title={`${studentName} 사례개념화`}>
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
                                    이 작업은 되돌릴 수 없습니다. 내용이 영구적으로 삭제됩니다.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        뒤로가기
                    </Button>
                </div>
            </PageHeader>
            <div
              className="prose max-w-none prose-sm sm:prose-base focus:outline-none p-6 border rounded-lg min-h-[60vh]"
              dangerouslySetInnerHTML={{ __html: conceptualization.content }}
            />
        </div>
    );
}
