
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { CounselingLog, PsychologicalTest, CombinedRecord } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import CombinedRecordList from "./CombinedRecordList";
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
      time: test.testTime,
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
  
  const handleDownloadExcel = () => {
    if (filteredRecords.length === 0) {
      toast({
        variant: 'destructive',
        title: '다운로드할 데이터가 없습니다.',
      });
      return;
    }

    const headers = ['날짜', '시간', '내담자', '구분', '내용'];
    const data = filteredRecords.map(record => [
      record.date,
      record.time || '',
      record.studentName,
      record.type,
      // 내용 필드의 쉼표가 CSV를 깨뜨리지 않도록 큰따옴표로 감싸줍니다.
      `"${record.details.replace(/"/g, '""')}"` 
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...data.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `상담및심리검사목록_${today}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <PageHeader title="상담 및 심리검사 목록">
        <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="내담자 이름으로 검색..."
              className="w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleDownloadExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                엑셀로 다운로드
            </Button>
        </div>
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
