
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, addDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { StudentApplication } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import ApplicationForm from './ApplicationForm';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StudentApplicationClientProps {
    studentId: string;
    studentName: string;
}

export default function StudentApplicationClient({ studentId, studentName }: StudentApplicationClientProps) {
    const { user } = useAuth();
    const [application, setApplication] = useState<StudentApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const formTitle = "학생 신청서";
    const collectionName = "studentApplications";
    const initialContent = `
    <h3>1. 내 소개</h3>
    <p>내 이름은: <strong>${studentName}</strong> / 나는 ____학년 ____반 입니다.</p>
    <br>
    <h3>2. 내 기분은 어때요?</h3>
    <p>요즘 내 기분에 가장 가까운 얼굴에 체크(v)해보세요. (여러 가지 선택 가능)</p>
    <p>[ ] 행복해요 [ ] 기뻐요 [ ] 그냥 그래요 [ ] 속상해요 [ ] 화가 나요 [ ] 슬퍼요 [ ] 걱정돼요</p>
    <p>[ ] 짜증나요 [ ] 불안해요 [ ] 낙심돼요 [ ] 절망스러워요</p>
    <p>그 밖에 다른 감정: ___________________</p>
    <br>
    <h3>3. 나는 이렇게 생각해요 (체크해 주세요.)</h3>
    <p><strong>나는 내 자신이 마음에 들어요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>내 의견을 잘 표현하는 편이에요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>친구들은 나를 좋아해요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>나는 부모님과 사이가 좋아요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>나에게 가끔 즐거운 일들이 있어요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>나는 남들보다 잘하는 것이 있어요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <p><strong>나는 요즘 마음이 힘들어요.</strong><br>[ ] 전혀 아니다 [ ] 아니다 [ ] 보통이다 [ ] 그렇다 [ ] 매우 그렇다</p>
    <br>
    <h3>4. 학교 수업은 어때요?</h3>
    <p>내가 가장 좋아하는 시간은: ________________ / 제일 힘든 시간은: ________________</p>
    <p>수업시간에 나는: [ ] 잘 듣는 편이에요 [ ] 가끔 딴 생각을 해요 [ ] 집중하기 어려워요</p>
    <br>
    <h3>5. 친구 관계는 어때요?</h3>
    <p>요즘 친한 친구는 몇 명 정도 있나요? [ ] 없음 / [ ] 1~2명 / [ ] 여러 명</p>
    <p>요즘 친구들과 사이가 좋은 편인가요? [ ] 네 / [ ] 아니요</p>
    <p>→ 아니라면, 어떤 이유 때문인지 짧게 써주세요: _________________________</p>
    <br>
    <h3>6. 나의 고민</h3>
    <p>요즘 마음에 어떤 고민거리가 있나요? 짧게 적어봐요. [ 그림을 그려도 좋아요! ]</p>
    <p>________________________________________________________________</p>
    <p>이 문제가 시작된 것은 언제부터였나요? _________________________</p>
    <p>이 문제는 나에게 얼마나 심각한가요? [ ] 심각하지 않음 [ ] 보통 [ ] 조금 심각함 [ ] 매우 심각함</p>
    <p>이 문제를 해결하기 위해 그동안 시도했던 방법이 있나요? 있었다면 효과는 있었나요?</p>
    <p>________________________________________________________________</p>
    <br>
    <h3>7. 내가 좋아하는 것 / 내가 잘 하는 것</h3>
    <p>→ 내가 좋아하는 활동을 모두 적어주세요. (예: 독서, 축구, 그림, 보드게임, 온라인게임, 춤, 악기 연주 등)</p>
    <p>________________________________________________________________</p>
    <p>→ 내가 잘하는 활동을 모두 적어주세요. (예: 운동, 공부(과목) 바둑, 종이접기, 보드게임, 노래, 춤 등)</p>
    <p>________________________________________________________________</p>
    <br>
    <h3>8. 내가 바라는 것</h3>
    <p>상담 기간: [ ] 오늘 하루 잠깐만 도와주세요 [ ] 앞으로 매주 규칙적인 상담을 원해요 [ ] 모르겠어요</p>
    <p>→ 상담이 끝난 후 앞으로 무엇이 달라졌으면 좋겠어요? 🙏</p>
    <p>________________________________________________________________</p>
    `;


    useEffect(() => {
        if (!studentId || !user?.uid) {
            setLoading(false);
            setApplication(null);
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
                const data = snapshot.docs[0].data() as StudentApplication;
                setApplication({ id: snapshot.docs[0].id, ...data });
            } else {
                setApplication(null);
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
            if (application) {
                const docRef = doc(db, collectionName, application.id);
                await setDoc(docRef, { content, updatedAt: Timestamp.now() }, { merge: true });
                toast({ title: '성공', description: `${formTitle}가 수정되었습니다.` });
            } else {
                await addDoc(collection(db, collectionName), {
                    userId: user.uid,
                    studentId,
                    studentName,
                    content,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
                toast({ title: '성공', description: `${formTitle}가 저장되었습니다.` });
            }
            setIsEditing(false);
        } catch (error) {
            console.error(`Error saving ${collectionName}: `, error);
            toast({ variant: 'destructive', title: '오류', description: '저장 중 오류가 발생했습니다.' });
        }
    };
    
    const handleDelete = async () => {
        if (!application) return;
        try {
            await deleteDoc(doc(db, collectionName, application.id));
            toast({ title: "성공", description: `${formTitle}가 삭제되었습니다.` });
            setApplication(null);
            setIsEditing(false);
        } catch (error) {
            console.error(`Error deleting ${collectionName}: `, error);
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

    if (isEditing || !application) {
        return (
            <ApplicationForm
                formTitle={formTitle}
                studentName={studentName}
                initialContent={application?.content || initialContent}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                handleDelete={application ? handleDelete : undefined}
            />
        );
    }

    return (
        <div className="p-8">
            <PageHeader title={`${studentName} ${formTitle}`}>
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
                dangerouslySetInnerHTML={{ __html: application.content }}
            />
        </div>
    );
}
