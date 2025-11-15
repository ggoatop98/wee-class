
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { CounselingLog, PsychologicalTest, CombinedRecord } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { DateRange } from "react-day-picker";

import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import CombinedRecordList from "./CombinedRecordList";
import { Button } from "../ui/button";
import DateRangePickerModal from "./DateRangePickerModal";

export default function CombinedRecordsClient() {
  const { user } = useAuth();
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [psychologicalTests, setPsychologicalTests] = useState<PsychologicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);

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
  
  const handleDownloadExcel = (dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) {
        return;
    }

    const recordsToDownload = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= dateRange.from! && recordDate <= dateRange.to!;
    });
    
    if (recordsToDownload.length === 0) {
      toast({
        variant: 'destructive',
        title: '다운로드할 데이터가 없습니다.',
        description: '선택한 기간에 해당하는 기록이 없습니다.',
      });
      return;
    }

    const dataToExport = recordsToDownload.map(record => ({
      '날짜': record.date,
      '시간': record.time || '',
      '내담자': record.studentName,
      '구분': record.type,
      '내용': record.details
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "상담 기록");
    
    // Column widths
    worksheet['!cols'] = [
        { wch: 12 }, // 날짜
        { wch: 10 }, // 시간
        { wch: 15 }, // 내담자
        { wch: 12 }, // 구분
        { wch: 50 }  // 내용
    ];

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `상담및심리검사목록_${today}.xlsx`);
    setIsDateRangeModalOpen(false);
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
            <Button onClick={() => setIsDateRangeModalOpen(true)} variant="outline">
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
      <DateRangePickerModal
        isOpen={isDateRangeModalOpen}
        onOpenChange={setIsDateRangeModalOpen}
        onDownload={handleDownloadExcel}
      />
    </>
  );
}
