
"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import RecordsClient from '@/components/records/RecordsClient';
import { AuthGuard } from '@/components/auth/AuthGuard';

function RecordDetailPageContent() {
  const params = useParams();
  const studentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchParams = useSearchParams();
  const studentName = searchParams.get('studentName') || '';

  if (!studentId) {
    // You can render a loading state or an error message here
    return (
        <AppLayout>
            <main className="p-8">
                <div>Loading...</div>
            </main>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="p-8">
        <RecordsClient studentId={studentId} studentName={studentName} />
      </main>
    </AppLayout>
  );
}

export default function RecordDetailPage() {
  return (
    <AuthGuard>
        <RecordDetailPageContent />
    </AuthGuard>
  );
}
