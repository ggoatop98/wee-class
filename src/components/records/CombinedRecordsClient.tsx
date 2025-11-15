

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { CounselingLog, PsychologicalTest, CombinedRecord, Student, CounselingDivision } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { DateRange } from "react-day-picker";
import { format, addMinutes } from "date-fns";

import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import CombinedRecordList from "./CombinedRecordList";
import { Button } from "../ui/button";
import DateRangePickerModal from "./DateRangePickerModal";
import { deleteObject, listAll, ref } from "firebase/storage";

export default function CombinedRecordsClient() {
  const { user } = useAuth();
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [psychologicalTests, setPsychologicalTests] = useState<PsychologicalTest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
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

    const studentsQuery = query(collection(db, "students"), where("userId", "==", user.uid));
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsData);
    });


    // Initial loading finished after both snapshots are active
    const timer = setTimeout(() => setLoading(false), 500);

    return () => {
      unsubLogs();
      unsubTests();
      unsubStudents();
      clearTimeout(timer);
    };
  }, [user]);

  const combinedRecords: CombinedRecord[] = useMemo(() => {
    const logsAsRecords: CombinedRecord[] = counselingLogs.map(log => {
      let middleCategory = '';
      const counseleeCount = 1 + (log.coCounselees?.length || 0);

      if (log.isAdvisory) {
        middleCategory = '교원자문';
      } else if (log.isParentCounseling) {
        middleCategory = '학부모상담';
      } else if (counseleeCount > 1) {
        middleCategory = '집단상담';
      } else {
        middleCategory = '개인상담';
      }

      let counselingDivision: CounselingDivision | '기타' | '학생관련상담' | '개인심리검사' | string | undefined = '';
      
      if (middleCategory === '교원자문') {
        counselingDivision = log.advisoryField;
      } else if (middleCategory === '학부모상담') {
        counselingDivision = '학생관련상담';
      } else if (middleCategory === '집단상담') {
        switch (log.counselingDivision) {
          case '진로':
            counselingDivision = '진로';
            break;
          case '성격':
          case '대인관계':
            counselingDivision = '성격/대인관계';
            break;
          case '학교폭력 가해':
          case '학교폭력 피해':
            counselingDivision = '학교폭력';
            break;
          default:
            counselingDivision = '기타';
            break;
        }
      } else if (log.counselingDivision) {
        counselingDivision = log.counselingDivision;
      }

      return {
        id: `log-${log.id}`,
        studentId: log.studentId,
        studentName: log.studentName,
        date: log.counselingDate,
        time: log.counselingTime,
        type: log.isAdvisory ? '자문' : '상담',
        middleCategory,
        counselingDivision,
        originalId: log.id,
        details: log.mainIssues,
        duration: log.counselingDuration,
        counselingMethod: log.counselingMethod,
        isAdvisory: log.isAdvisory,
        isParentCounseling: log.isParentCounseling,
        coCounselees: log.coCounselees,
      }
    });

    const testsAsRecords: CombinedRecord[] = psychologicalTests.map(test => ({
      id: `test-${test.id}`,
      studentId: test.studentId,
      studentName: test.studentName,
      date: test.testDate,
      time: test.testTime,
      type: '검사',
      middleCategory: '심리검사',
      counselingDivision: '개인심리검사',
      originalId: test.id,
      details: test.testName,
      duration: test.testDuration,
      counselingMethod: test.testMethod,
    }));

    const allRecords = [...logsAsRecords, ...testsAsRecords];
    allRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA < dateB) return 1;
      if (dateA > dateB) return -1;
      
      if (a.time && b.time) {
          if (a.time < b.time) return 1;
          if (a.time > b.time) return -1;
      }
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
    if (!user) return;
    try {
        const collectionName = record.type === '상담' || record.type === '자문' ? 'counselingLogs' : 'psychologicalTests';
        
        // Delete related files if it's a student record (though this should be handled in student delete)
        if (record.type !== '상담' && record.type !== '자문' && record.type !== '검사') {
            const storageFolderRef = ref(storage, `student_files/${user.uid}/${record.studentId}`);
            const res = await listAll(storageFolderRef);
            await Promise.all(res.items.map((itemRef) => deleteObject(itemRef)));
        }

        await deleteDoc(doc(db, collectionName, record.originalId));
        toast({ title: '성공', description: `기록이 삭제되었습니다.` });
    } catch (error) {
        console.error("Error deleting record: ", error);
        toast({ variant: 'destructive', title: '오류', description: '기록 삭제 중 오류가 발생했습니다.' });
    }
  };

  const handleEdit = (record: CombinedRecord) => {
    const { studentId, studentName, type } = record;
    const url = type === '상담' || type === '자문' ? `/records/${studentId}?studentName=${encodeURIComponent(studentName)}` : `/records/${studentId}/tests?studentName=${encodeURIComponent(studentName)}`;
    router.push(url);
  };
  
  const handleDownloadExcel = (dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) {
        return;
    }

    const studentsMap = new Map(students.map(s => [s.id, s]));

    const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
    const toDateStr = format(dateRange.to, 'yyyy-MM-dd');

    const recordsToDownload = combinedRecords.filter(record => {
        const recordDateStr = record.date;
        return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
    });
    
    if (recordsToDownload.length === 0) {
      toast({
        variant: 'destructive',
        title: '다운로드할 데이터가 없습니다.',
        description: '선택한 기간에 해당하는 기록이 없습니다.',
      });
      return;
    }

    const dataToExport = recordsToDownload.map(record => {
      const studentInfo = studentsMap.get(record.studentId);
      
      const recordDate = new Date(record.date);

      const startTime = record.time ? new Date(`${record.date}T${record.time}`) : new Date(record.date);
      const totalDuration = record.duration || 40;
      const hours = Math.floor(totalDuration / 60);
      const minutes = totalDuration % 60;
      const endTime = addMinutes(startTime, totalDuration);
      
      let 대분류 = record.type;
      let 중분류 = record.middleCategory || '';
      
      let 상담구분 = record.counselingDivision || '';
      let 상담내용 = record.type === '상담' ? record.details : '';
      let 상담인원 = 1 + (record.coCounselees?.length || 0);
      
      if (record.type === '검사') {
        대분류 = '검사';
        중분류 = '심리검사';
        상담구분 = '개인심리검사';
        상담내용 = ''; // 검사 내용은 엑셀에 포함되지 않음
      }
      
      if (record.isAdvisory) {
        상담구분 = record.advisoryField || '기타';
      }

      return {
        '상담분류': '전문상담',
        'Wee클래스': 'Wee클래스',
        '대분류': 대분류,
        '중분류': 중분류, 
        '상담구분': 상담구분,
        '상담인원': 상담인원,
        '학년도': recordDate.getFullYear(),
        '상담일자': format(recordDate, 'yyyyMMdd'),
        '학년': studentInfo?.class.split('-')[0] + '학년' || '',
        '성별': studentInfo?.gender || '',
        '상담제목': '',
        '상담내용': 상담내용, 
        '상담시간(시)': hours > 0 ? hours : '',
        '상담시간(분)': minutes,
        '상담사소속': '전문상담교사',
        '상담매체구분': record.counselingMethod || '면담',
        '': '', // Empty Q column
        '상담시작시각': record.time ? format(startTime, 'yyyy. MM. dd. HH:mm') : '',
        '상담종료시각': record.time ? format(endTime, 'yyyy. MM. dd. HH:mm') : '',
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      header: ['상담분류', 'Wee클래스', '대분류', '중분류', '상담구분', '상담인원', '학년도', '상담일자', '학년', '성별', '상담제목', '상담내용', '상담시간(시)', '상담시간(분)', '상담사소속', '상담매체구분', '', '상담시작시각', '상담종료시각']
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "상담 기록");
    
    // Column widths
    worksheet['!cols'] = [
        { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
        { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 12 }, {wch: 2}, { wch: 20 }, { wch: 20 }
    ];

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `상담및심리검사목록_${today}.xlsx`);
    setIsDateRangeModalOpen(false);
  };


  return (
    <>
      <PageHeader title="상담 및 검사 목록">
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

    

    
