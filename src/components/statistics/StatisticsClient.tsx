
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CounselingLog, PsychologicalTest, CombinedRecord, Student, CounselingDivision, CoCounselee } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth } from "date-fns";

import { PageHeader } from "../PageHeader";
import DateRangePickerModal from "../records/DateRangePickerModal";
import { Button } from "../ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import StatisticsTable from "./StatisticsTable";
import { Card, CardContent } from "../ui/card";

export interface StatisticRow {
    no: number | string;
    level1: string;
    level2: string;
    level3: string;
    count: number;
    avgTime: number;
    isTotal?: boolean;
}

export default function StatisticsClient() {
  const { user } = useAuth();
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [psychologicalTests, setPsychologicalTests] = useState<PsychologicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  useEffect(() => {
    if (!user?.uid) return;
    
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

    Promise.all([
        new Promise(resolve => onSnapshot(logsQuery, () => resolve(true))),
        new Promise(resolve => onSnapshot(testsQuery, () => resolve(true))),
    ]).then(() => setLoading(false));

    return () => {
      unsubLogs();
      unsubTests();
    };
  }, [user?.uid]);

  const combinedRecords: CombinedRecord[] = useMemo(() => {
    const logsAsRecords: CombinedRecord[] = counselingLogs.map(log => ({
      id: `log-${log.id}`,
      studentId: log.studentId,
      studentName: log.studentName,
      date: log.counselingDate,
      time: log.counselingTime,
      type: log.isAdvisory ? '자문' : '상담',
      middleCategory: log.isParentCounseling ? '학부모상담' : ((log.coCounselees && log.coCounselees.length > 0) ? '집단상담' : '개인상담'),
      counselingDivision: log.isAdvisory ? log.advisoryField : log.counselingDivision,
      originalId: log.id,
      details: log.mainIssues,
      duration: log.counselingDuration,
      isParentCounseling: log.isParentCounseling,
      coCounselees: log.coCounselees
    }));

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
    }));

    return [...logsAsRecords, ...testsAsRecords];
  }, [counselingLogs, psychologicalTests]);

  const filteredRecords = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
    const toDateStr = format(dateRange.to, 'yyyy-MM-dd');
    
    return combinedRecords.filter(record => {
      const recordDateStr = record.date;
      return recordDateStr >= fromDateStr && recordDateStr <= toDateStr;
    });
  }, [combinedRecords, dateRange]);

  const statisticsData = useMemo(() => {
    const data: StatisticRow[] = [];
    let noCounter = 1;

    // 1. 상담
    const parentCounseling = filteredRecords.filter(r => r.isParentCounseling);
    const parentCounselingCount = parentCounseling.length;
    const parentCounselingTime = parentCounseling.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(parentCounselingCount > 0){
        data.push({ no: noCounter++, level1: '상담', level2: '학부모상담', level3: '학생관련상담', count: parentCounselingCount, avgTime: parentCounselingTime / parentCounselingCount });
        data.push({ no: '', level1: '상담', level2: '학부모상담', level3: '학부모상담합계', count: parentCounselingCount, avgTime: parentCounselingTime / parentCounselingCount, isTotal: true });
    }

    const individualCounseling = filteredRecords.filter(r => r.type === '상담' && !r.isParentCounseling && (!r.coCounselees || r.coCounselees.length === 0));
    const individualByDivision = individualCounseling.reduce((acc, r) => {
        const division = r.counselingDivision || '기타';
        if (!acc[division]) acc[division] = { count: 0, totalTime: 0, records: [] };
        acc[division].count++;
        acc[division].totalTime += (r.duration || 0);
        acc[division].records.push(r);
        return acc;
    }, {} as Record<string, { count: number; totalTime: number; records: CombinedRecord[] }>);

    Object.entries(individualByDivision).forEach(([division, { count, totalTime }]) => {
        data.push({ no: noCounter++, level1: '상담', level2: '개인상담', level3: division, count, avgTime: totalTime / count });
    });
    const individualTotalCount = individualCounseling.length;
    const individualTotalTime = individualCounseling.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(individualTotalCount > 0){
        data.push({ no: '', level1: '상담', level2: '개인상담', level3: '개인상담합계', count: individualTotalCount, avgTime: individualTotalTime / individualTotalCount, isTotal: true });
    }

    const groupCounseling = filteredRecords.filter(r => r.type === '상담' && !r.isParentCounseling && r.coCounselees && r.coCounselees.length > 0);
    const groupCounselingCount = groupCounseling.length;
    const groupCounselingTime = groupCounseling.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(groupCounselingCount > 0){
        data.push({ no: noCounter++, level1: '상담', level2: '집단상담', level3: '성격/대인관계', count: groupCounselingCount, avgTime: groupCounselingTime / groupCounselingCount });
        data.push({ no: '', level1: '상담', level2: '집단상담', level3: '집단상담합계', count: groupCounselingCount, avgTime: groupCounselingTime / groupCounselingCount, isTotal: true });
    }

    const studentCounselingTotal = individualCounseling.concat(groupCounseling);
    const studentCounselingTotalCount = studentCounselingTotal.length;
    const studentCounselingTotalTime = studentCounselingTotal.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(studentCounselingTotalCount > 0){
       data.push({ no: '', level1: '상담', level2: '학생상담 합계', level3: '', count: studentCounselingTotalCount, avgTime: studentCounselingTotalTime / studentCounselingTotalCount, isTotal: true });
    }
    
    const allCounseling = parentCounseling.concat(studentCounselingTotal);
    const allCounselingCount = allCounseling.length;
    const allCounselingTime = allCounseling.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(allCounselingCount > 0){
        data.push({ no: '', level1: '상담', level2: '상담합계', level3: '', count: allCounselingCount, avgTime: allCounselingTime / allCounselingCount, isTotal: true });
    }

    // 2. 검사
    const tests = filteredRecords.filter(r => r.type === '검사');
    const testsCount = tests.length;
    const testsTime = tests.reduce((sum, r) => sum + (r.duration || 0), 0);
    if(testsCount > 0){
        data.push({ no: noCounter++, level1: '검사', level2: '심리검사', level3: '개인심리검사', count: testsCount, avgTime: testsTime / testsCount });
        data.push({ no: '', level1: '검사', level2: '심리검사', level3: '심리검사합계', count: testsCount, avgTime: testsTime / testsCount, isTotal: true });
        data.push({ no: '', level1: '검사', level2: '검사합계', level3: '', count: testsCount, avgTime: testsTime / testsCount, isTotal: true });
    }
    
    // 3. 자문
    const advisory = filteredRecords.filter(r => r.type === '자문');
    const advisoryByDivision = advisory.reduce((acc, r) => {
        const division = r.counselingDivision || '기타';
        if (!acc[division]) acc[division] = { count: 0, totalTime: 0 };
        acc[division].count++;
        acc[division].totalTime += (r.duration || 0);
        return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    Object.entries(advisoryByDivision).forEach(([division, { count, totalTime }]) => {
         data.push({ no: noCounter++, level1: '자문', level2: '교원자문', level3: division, count, avgTime: totalTime / count });
    });
    const advisoryCount = advisory.length;
    const advisoryTime = advisory.reduce((sum, r) => sum + (r.duration || 0), 0);
     if(advisoryCount > 0){
        data.push({ no: '', level1: '자문', level2: '교원자문', level3: '교원자문합계', count: advisoryCount, avgTime: advisoryTime / advisoryCount, isTotal: true });
        data.push({ no: '', level1: '자문', level2: '자문합계', level3: '', count: advisoryCount, avgTime: advisoryTime / advisoryCount, isTotal: true });
    }

    // 최종 합계
    const totalCount = filteredRecords.length;
    const totalTime = filteredRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    if (totalCount > 0) {
      data.push({ no: '합계', level1: '', level2: '', level3: '', count: totalCount, avgTime: totalTime / totalCount, isTotal: true });
    }
    
    return data;
  }, [filteredRecords]);

  const handleSetDateRange = (range: DateRange) => {
    setDateRange(range);
    setIsDateRangeModalOpen(false);
  }

  const rangeText = useMemo(() => {
    if (dateRange.from && dateRange.to) {
        return `${format(dateRange.from, 'yyyy.MM.dd')} - ${format(dateRange.to, 'yyyy.MM.dd')}`;
    }
    return "기간을 선택하세요";
  }, [dateRange]);

  return (
    <>
      <PageHeader title="상담 현황 통계">
        <Button onClick={() => setIsDateRangeModalOpen(true)} variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {rangeText}
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <StatisticsTable data={statisticsData} loading={loading} />
        </CardContent>
      </Card>
      <DateRangePickerModal
        isOpen={isDateRangeModalOpen}
        onOpenChange={setIsDateRangeModalOpen}
        onDownload={handleSetDateRange}
        downloadType="ledger" 
      />
    </>
  );
}
