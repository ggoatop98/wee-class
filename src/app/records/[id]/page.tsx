
import { AppLayout } from "@/components/layout/AppLayout";
import RecordsClient from "@/components/records/RecordsClient";
import React from "react";

export default function RecordDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { studentName?: string } }) {
  const studentName = searchParams.studentName;

  return (
    <AppLayout>
      <main className="p-8">
        <RecordsClient 
          studentId={params.id} 
          studentName={studentName || ''} 
        />
      </main>
    </AppLayout>
  );
}
