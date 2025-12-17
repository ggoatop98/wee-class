
"use client";

import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDownload: (dateRange: DateRange) => void;
  downloadType: 'neisedu' | 'ledger';
}

export default function DateRangePickerModal({ isOpen, onOpenChange, onDownload, downloadType }: DateRangePickerModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
        setDateRange(undefined);
    }
  }, [isOpen]);

  const handleDownloadClick = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
        toast({
            variant: 'destructive',
            title: '기간 오류',
            description: '기간을 선택해주세요.',
        });
        return;
    }
    onDownload(dateRange);
  };

  const getRangeText = () => {
    if (!dateRange || !dateRange.from) {
        return "다운로드할 기간을 선택하세요.";
    }
    if (!dateRange.to) {
        return `${format(dateRange.from, "PPP", { locale: ko })} 부터...`;
    }
    return `${format(dateRange.from, "PPP", { locale: ko })} - ${format(dateRange.to, "PPP", { locale: ko })}`;
  }
  
  const title = downloadType === 'ledger' ? '기간 선택' : '다운로드 기간 선택';
  const description = downloadType === 'ledger'
    ? '통계를 다운로드할 기간을 선택하세요.'
    : '엑셀 파일로 다운로드할 상담 기록의 기간을 선택하세요.';

  const buttonText = '다운로드';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
            <Calendar
                initialFocus
                mode="range"
                locale={ko}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
            />
            <p className="text-sm font-medium text-center p-2 bg-muted rounded-md w-full">
                {getRangeText()}
            </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleDownloadClick}>
            <Download className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
