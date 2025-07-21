
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function RecordsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        const q = query(collection(db, "students"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
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

    const handleStudentClick = (student: Student) => {
        router.push(`/records/${student.id}?studentName=${encodeURIComponent(student.name)}`);
    };

    return (
        <AppLayout>
            <main className="p-8">
                <PageHeader title="상담 목록">
                    <Input
                        type="search"
                        placeholder="내담자 이름으로 검색..."
                        className="w-72"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </PageHeader>
                <Card>
                    <CardHeader>
                        <CardTitle>내담자 선택</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <ScrollArea className="h-[60vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => handleStudentClick(student)}
                                                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                            >
                                                <p className="font-semibold">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">{student.class}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground col-span-full text-center py-4">
                                            검색 결과가 없습니다.
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
