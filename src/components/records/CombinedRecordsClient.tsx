

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
import { format, addMinutes, formatISO } from "date-fns";
import { ko } from 'date-fns/locale';

import { PageHeader } from "../PageHeader";
import { Input } from "@/components/ui/input";
import CombinedRecordList from "./CombinedRecordList";
import { Button } from "../ui/button";
import DateRangePickerModal from "./DateRangePickerModal";
import { deleteObject, listAll, ref } from "firebase/storage";

type DownloadType = 'neisedu' | 'ledger';

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
  const [downloadType, setDownloadType] = useState<DownloadType>('neisedu');


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
  
 const handleOpenDownloadModal = (type: DownloadType) => {
    setDownloadType(type);
    setIsDateRangeModalOpen(true);
  };
  
  const handleDownloadExcel = (dateRange: DateRange) => {
    if (downloadType === 'neisedu') {
        handleNeisEduExcelDownload(dateRange);
    } else {
        handleLedgerExcelDownload(dateRange);
    }
    setIsDateRangeModalOpen(false);
  };


  const handleNeisEduExcelDownload = (dateRange: DateRange) => {
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
      const recordDate = new Date(`${record.date}T00:00:00`);
      const startTime = record.time ? new Date(`${record.date}T${record.time}`) : new Date(record.date);
      const totalDuration = record.duration || 40;
      const hours = record.time ? Math.floor(totalDuration / 60) : 0;
      const minutes = record.time ? totalDuration % 60 : 0;
      const endTime = addMinutes(startTime, totalDuration);
      
      const 대분류 = record.type;
      const 중분류 = record.middleCategory || '';
      const 상담구분 = record.counselingDivision || '';
      const 상담매체 = record.counselingMethod || '면담';

      const grade = studentInfo?.class.split('-')[0] ? `${studentInfo.class.split('-')[0]}학년` : '';
      const gender = studentInfo?.gender || '';
      const counselingDivisionText = 상담구분 || '';

      let 상담내용 = '';
      if (record.isAdvisory) {
          상담내용 = "학생 정서, 적응행동 관련 교원 자문";
      } else if (record.type === '상담') {
          상담내용 = `${grade}, ${gender}, ${counselingDivisionText}, 관련 상담`;
      } else if (record.type === '검사') {
          상담내용 = `${record.details}, 학생 심리 검사 및 해석 관련 상담`;
      }

      const 상담인원 = 1 + (record.coCounselees?.length || 0);

      return {
        '상담분류': '전문상담',
        'Wee클래스': 'Wee클래스',
        '대분류': 대분류,
        '중분류': 중분류, 
        '상담구분': 상담구분,
        '상담인원': 상담인원,
        '학년도': recordDate.getFullYear(),
        '상담일자': format(recordDate, 'yyyyMMdd'),
        '학년': grade,
        '성별': gender,
        '상담제목': '',
        '상담내용': 상담내용, 
        '상담시간(시)': hours,
        '상담시간(분)': minutes,
        '상담사소속': '전문상담교사',
        '상담매체구분': 상담매체,
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
        { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 12 }, {wch: 2}, { wch: 20 }, { wch: 20 }
    ];

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Wee클래스_상담일지_${today}.xlsx`);
  };

  const handleLedgerExcelDownload = (dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) return;
  
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
  
    const dataToExport = recordsToDownload.map((record, index) => {
      const studentInfo = studentsMap.get(record.studentId);
      const recordDate = new Date(`${record.date}T00:00:00`);
      const startTime = record.time ? new Date(`${record.date}T${record.time}`) : null;
      const endTime = startTime && record.duration ? addMinutes(startTime, record.duration) : null;
      
      const counselingTime = startTime && endTime 
        ? `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`
        : (startTime ? format(startTime, 'HH:mm') : '');

      const counseleeNames = [record.studentName, ...(record.coCounselees?.map(c => c.name) || [])].join(', ');
      
      let middleCategory = record.middleCategory || '';
      if(record.isAdvisory) middleCategory = '교원자문';
      else if(record.isParentCounseling) middleCategory = '학부모상담';
      else if(record.type === '검사') middleCategory = '심리검사';
      else if((record.coCounselees?.length || 0) > 0) middleCategory = '집단상담';
      else middleCategory = '개인상담';

      let counselingDivision = record.counselingDivision || '';
      if(middleCategory === '교원자문') counselingDivision = record.counselingDivision || '사회성발달';
      if(middleCategory === '학부모상담') counselingDivision = '학생관련상담';
      if(middleCategory === '심리검사') counselingDivision = '개인심리검사';


      return {
        '연번': index + 1,
        '상담 일자': `${format(recordDate, 'yyyy.MM.dd')}(${format(recordDate, 'E', { locale: ko })})`,
        '상담 시간': counselingTime,
        '학년/반': studentInfo?.class || '',
        '이름': counseleeNames,
        '중분류': middleCategory,
        '상담구분': counselingDivision
      };
    });
    
    const header = ["연번", "상담 일자", "상담 시간", "학년/반", "이름", "중분류", "상담구분"];
    const worksheet = XLSX.utils.json_to_sheet([], { skipHeader: true });
    
    XLSX.utils.sheet_add_aoa(worksheet, [['상담관리대장']], { origin: 'A1' });
    
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 6 } }];

    // Center align the title
    if (!worksheet['A1']) worksheet['A1'] = {v: '상담관리대장'};
    worksheet['A1'].s = { alignment: { horizontal: 'center', vertical: 'center' } };

    XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: 'A3' });
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A4', skipHeader: true });

    worksheet['!cols'] = [
      { wch: 5 },  // 연번
      { wch: 15 }, // 상담 일자
      { wch: 15 }, // 상담 시간
      { wch: 8 },  // 학년/반
      { wch: 30 }, // 이름
      { wch: 12 }, // 중분류
      { wch: 15 }  // 상담구분
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "상담관리대장");
  
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `상담관리대장_${today}.xlsx`);
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
            <Button onClick={() => handleOpenDownloadModal('neisedu')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                엑셀로 다운로드
            </Button>
            <Button onClick={() => handleOpenDownloadModal('ledger')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                상담관리대장
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
        downloadType={downloadType}
      />
    </>
  );
}
