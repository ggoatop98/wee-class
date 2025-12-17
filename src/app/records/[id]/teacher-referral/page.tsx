
"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import TeacherReferralClient from '@/components/records/TeacherReferralClient';
import { AuthGuard } from '@/components/auth/AuthGuard';


function TeacherReferralPageContent() {
  const params = useParams();
  const studentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchParams = useSearchParams();
  const studentName = searchParams.get('studentName') || '';

  if (!studentId) {
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
      <main>
        <TeacherReferralClient studentId={studentId} studentName={studentName} />
      </main>
    </AppLayout>
  );
}

export default function TeacherReferralPage() {
  return (
    <AuthGuard>
      <TeacherReferralPageContent />
    </AuthGuard>
  );
}
