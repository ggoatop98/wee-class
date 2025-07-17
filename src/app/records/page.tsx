import { AppLayout } from "@/components/layout/AppLayout";
import RecordsClient from "@/components/records/RecordsClient";
import React, { Suspense } from "react";

export default function RecordsPage() {
  return (
    <AppLayout>
      <main className="p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <RecordsClient />
        </Suspense>
      </main>
    </AppLayout>
  );
}
