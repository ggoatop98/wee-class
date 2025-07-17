"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, UserPlus, ArrowRight } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function Home() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  return (
    <AppLayout>
      <main className="p-8">
        <PageHeader title="Home" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>빠른 실행</CardTitle>
              <CardDescription>자주 사용하는 기능을 빠르게 실행하세요.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setIsAppointmentModalOpen(true)} className="w-full sm:w-auto">
                <CalendarPlus className="mr-2 h-4 w-4" />
                일정 추가
              </Button>
              <Button onClick={() => setIsStudentModalOpen(true)} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                내담자 추가
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>예정된 일정</CardTitle>
              <CardDescription>다가오는 상담 및 기타 일정입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {/* Dummy Data */}
                <li className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-semibold">김민준 학생 상담</p>
                    <p className="text-sm text-muted-foreground">오늘, 14:00 - 15:00</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </li>
                <li className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-semibold">이서연 학생 정서행동검사</p>
                    <p className="text-sm text-muted-foreground">내일, 10:00 - 11:00</p>
                  </div>
                   <Button variant="ghost" size="sm">
                    자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </li>
                 <li className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-semibold">교사 자문회의</p>
                    <p className="text-sm text-muted-foreground">2025.07.25, 16:00 - 17:00</p>
                  </div>
                   <Button variant="ghost" size="sm">
                    자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>공지사항</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                여름방학 중 상담실 운영 안내 및 2학기 상담 신청 기간에 대한 공지입니다. 자세한 내용은 내부 메신저를 확인해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <StudentForm isOpen={isStudentModalOpen} onOpenChange={setIsStudentModalOpen} />
      <AppointmentForm isOpen={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
    </AppLayout>
  );
}
