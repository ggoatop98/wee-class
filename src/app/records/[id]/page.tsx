
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import RecordsClient from '@/components/records/RecordsClient';

// Note: This component is a Client Component because it uses the `useSearchParams` hook.
export default function RecordDetailPage({ params }: { params: { id: string } }) {
  const studentId = params.id;
  const searchParams = useSearchParams();
  const studentName = searchParams.get('studentName') || '';

  return (
    <AppLayout>
      <main className="p-8">
        <RecordsClient studentId={studentId} studentName={studentName} />
      </main>
    </AppLayout>
  );
}
