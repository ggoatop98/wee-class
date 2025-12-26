
"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import StudentApplicationClient from '@/components/records/StudentApplicationClient';
import { AuthGuard } from '@/components/auth/AuthGuard';


function StudentApplicationPageContent() {
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
        <StudentApplicationClient studentId={studentId} studentName={studentName} />
      </main>
    </AppLayout>
  );
}

export default function StudentApplicationPage() {
  return (
    <AuthGuard>
      <StudentApplicationPageContent />
    </AuthGuard>
  );
}
