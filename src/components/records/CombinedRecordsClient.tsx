
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { CounselingLog, PsychologicalTest, CombinedRecord } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import CombinedRecordList from "./CombinedRecordList";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";

export default function CombinedRecordsClient() {
  const { user } = useAuth();
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [psychologicalTests, setPsychologicalTests] = useState<PsychologicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);

    const logsQuery = query(collection(db, "counselingLogs"), where("userId", "==", user.uid));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingLog));
      setCounselingLogs(logsData);
    });

    const testsQuery = query(collection(db, "psychologicalTests"), where("userId", "==", user.uid));
    const unsubTests = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PsychologicalTest));
      setPsychologicalTests(testsData);
    });

    // Initial loading finished after both snapshots are active
    const timer = setTimeout(() => setLoading(false), 500);

    return () => {
      unsubLogs();
      unsubTests();
      clearTimeout(timer);
    };
  }, [user]);

  const combinedRecords: CombinedRecord[] = useMemo(() => {
    const logsAsRecords: CombinedRecord[] = counselingLogs.map(log => ({
      id: `log-${log.id}`,
      studentId: log.studentId,
      studentName: log.studentName,
      date: log.counselingDate,
      time: log.counselingTime,
      type: '상담',
      originalId: log.id,
      details: log.mainIssues,
    }));

    const testsAsRecords: CombinedRecord[] = psychologicalTests.map(test => ({
      id: `test-${test.id}`,
      studentId: test.studentId,
      studentName: test.studentName,
      date: test.testDate,
      type: '심리검사',
      originalId: test.id,
      details: test.testName,
    }));

    const allRecords = [...logsAsRecords, ...testsAsRecords];
    allRecords.sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      if (a.time && b.time) return b.time.localeCompare(a.time);
      return 0;
    });

    return allRecords;
  }, [counselingLogs, psychologicalTests]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) {
      return combinedRecords;
    }
    return combinedRecords.filter(record =>
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedRecords, searchTerm]);

  const handleDelete = async (record: CombinedRecord) => {
    try {
        const collectionName = record.type === '상담' ? 'counselingLogs' : 'psychologicalTests';
        await deleteDoc(doc(db, collectionName, record.originalId));
        toast({ title: '성공', description: `기록이 삭제되었습니다.` });
    } catch (error) {
        console.error("Error deleting record: ", error);
        toast({ variant: 'destructive', title: '오류', description: '기록 삭제 중 오류가 발생했습니다.' });
    }
  };

  const handleEdit = (record: CombinedRecord) => {
    const { studentId, studentName, type } = record;
    const url = type === '상담' ? `/records/${studentId}?studentName=${encodeURIComponent(studentName)}` : `/records/${studentId}/tests?studentName=${encodeURIComponent(studentName)}`;
    router.push(url);
  };

  return (
    <>
      <PageHeader title="상담 및 심리검사 목록">
        <Input
          type="search"
          placeholder="내담자 이름으로 검색..."
          className="w-72"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </PageHeader>
      <CombinedRecordList
        records={filteredRecords}
        onDelete={handleDelete}
        onEdit={handleEdit}
        loading={loading}
      />
    </>
  );
}
