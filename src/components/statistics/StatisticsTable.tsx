
"use client";

import React, { useMemo } from 'react';
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
  const processedData = useMemo(() => {
    const displayData: (StatisticRow & { rowSpan?: { level1?: number, level2?: number } })[] = [];
    let i = 0;
    while (i < data.length) {
      const currentRow = data[i];
      let level1RowSpan = 1;
      let level2RowSpan = 1;

      // Calculate level1 rowspan
      if (currentRow.level1) {
        for (let j = i + 1; j < data.length; j++) {
          if (data[j].level1 === currentRow.level1) {
            level1RowSpan++;
          } else {
            break;
          }
        }
      }
      
      // Calculate level2 rowspan
      if (currentRow.level2) {
          for (let j = i + 1; j < data.length; j++) {
            if (data[j].level1 === currentRow.level1 && data[j].level2 === currentRow.level2) {
              level2RowSpan++;
            } else {
              break;
            }
          }
      }
      
      displayData.push({ ...currentRow, rowSpan: { level1: level1RowSpan, level2: level2RowSpan } });
      
      let processedInLevel2 = 1;
      
      // Skip rows that are already part of a rowspan
      for (let j = i + 1; j < i + level1RowSpan; j++) {
          const nextRow = data[j];
          if(nextRow.level1 === currentRow.level1) {
              if(nextRow.level2 === currentRow.level2){
                  displayData.push({ ...nextRow });
                  processedInLevel2++;
              } else {
                  // New level2 group starts
                   let nextLevel2RowSpan = 1;
                   for (let k = j + 1; k < data.length; k++) {
                       if (data[k].level1 === nextRow.level1 && data[k].level2 === nextRow.level2) {
                           nextLevel2RowSpan++;
                       } else {
                           break;
                       }
                   }
                  displayData.push({ ...nextRow, rowSpan: { level2: nextLevel2RowSpan } });
              }
          }
      }
      i += level1RowSpan;
    }
    
    // This logic is complex, let's simplify by hiding merged cells
    const finalData: (StatisticRow & { hide?: { level1?: boolean, level2?: boolean } })[] = [];
    for(let i = 0; i < data.length; i++) {
        const row = data[i];
        const prevRow = i > 0 ? data[i-1] : null;
        const hide: { level1?: boolean, level2?: boolean } = {};
        if (prevRow && row.level1 === prevRow.level1 && row.level1 !== '') {
            hide.level1 = true;
        }
        if (prevRow && row.level1 === prevRow.level1 && row.level2 === prevRow.level2 && row.level2 !== '') {
            hide.level2 = true;
        }
        finalData.push({...row, hide});
    }

    return finalData;

  }, [data]);


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

  const getRowSpan = (level: 'level1' | 'level2', index: number) => {
    if (data[index].hide?.[level]) return 0;

    let rowSpan = 1;
    for (let i = index + 1; i < data.length; i++) {
        if(data[i][level] === data[index][level] && data[i][level] !== '') {
            if (level === 'level2' && data[i].level1 !== data[index].level1) break;
            rowSpan++;
        } else {
            break;
        }
    }
    return rowSpan;
  }

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
              const level1RowSpan = getRowSpan('level1', index);
              const level2RowSpan = getRowSpan('level2', index);
              
              return (
                <TableRow key={index} className={cn(item.isTotal && "bg-muted/80 font-bold")}>
                    <TableCell className="text-center">{item.no}</TableCell>
                    
                    {level1RowSpan > 0 && <TableCell className="text-center" rowSpan={level1RowSpan}>{item.level1}</TableCell>}
                    
                    {level2RowSpan > 0 && <TableCell rowSpan={level2RowSpan}>{item.level2}</TableCell>}

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
