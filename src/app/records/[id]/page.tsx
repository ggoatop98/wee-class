
import React from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import RecordsClient from '@/components/records/RecordsClient';

interface RecordDetailPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RecordDetailPage({ params, searchParams }: RecordDetailPageProps) {
  const studentId = params.id;
  const studentName = typeof searchParams.studentName === 'string' ? searchParams.studentName : '';

  return (
    <AppLayout>
      <main className="p-8">
        <RecordsClient studentId={studentId} studentName={studentName} />
      </main>
    </AppLayout>
  );
}
