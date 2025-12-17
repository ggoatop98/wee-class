
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { StatisticRow } from './StatisticsClient';

interface StatisticsTableProps {
  data: StatisticRow[];
  loading: boolean;
}

export default function StatisticsTable({ data, loading }: StatisticsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
             <TableRow>
                <TableHead className="w-16">No.</TableHead>
                <TableHead>대분류</TableHead>
                <TableHead>중분류</TableHead>
                <TableHead>상담구분</TableHead>
                <TableHead>상담건수</TableHead>
                <TableHead>평균상담시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const getRowSpan = (data: StatisticRow[], level: 'level1' | 'level2', index: number) => {
    const currentValue = data[index][level];
    if (currentValue === '') return 1;

    let rowSpan = 0;
    for (let i = index; i < data.length; i++) {
        if (data[i][level] === currentValue &&
           (level === 'level1' || data[i].level1 === data[index].level1)) {
            rowSpan++;
        } else {
            break;
        }
    }
    return rowSpan;
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">No.</TableHead>
            <TableHead className="w-32 text-center">대분류</TableHead>
            <TableHead className="w-48 text-center">중분류</TableHead>
            <TableHead className="w-48 text-center">상담구분</TableHead>
            <TableHead className="w-24 text-center">상담건수</TableHead>
            <TableHead className="w-32 text-center">평균상담시간(분)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
             <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                선택한 기간에 해당하는 기록이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => {
              const prevItem = index > 0 ? data[index - 1] : null;

              const showLevel1 = !prevItem || prevItem.level1 !== item.level1 || item.level1 === '';
              const showLevel2 = !prevItem || prevItem.level2 !== item.level2 || (prevItem.level1 !== item.level1) || item.level2 === '';

              const level1RowSpan = showLevel1 ? getRowSpan(data, 'level1', index) : 0;
              const level2RowSpan = showLevel2 ? getRowSpan(data, 'level2', index) : 0;
              
              if(item.level1 === '' && item.no === '합계'){
                return (
                     <TableRow key={index} className="bg-muted/90 font-bold">
                        <TableCell colSpan={4} className="text-center text-lg">{item.no}</TableCell>
                        <TableCell className="text-center text-lg">{item.count}</TableCell>
                        <TableCell className="text-center text-lg">{item.avgTime.toFixed(2)}</TableCell>
                    </TableRow>
                )
              }

              return (
                <TableRow key={index} className={cn(item.isTotal && "bg-muted/80 font-bold")}>
                    <TableCell className="text-center">{item.no}</TableCell>
                    
                    {level1RowSpan > 0 && <TableCell className="text-center align-top" rowSpan={level1RowSpan}>{item.level1}</TableCell>}
                    
                    {level2RowSpan > 0 && <TableCell className="align-top" rowSpan={level2RowSpan}>{item.level2}</TableCell>}

                    <TableCell>{item.level3}</TableCell>
                    <TableCell className="text-center">{item.count}</TableCell>
                    <TableCell className="text-center">{item.avgTime.toFixed(2)}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
