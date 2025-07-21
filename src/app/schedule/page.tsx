import { AppLayout } from "@/components/layout/AppLayout";
import AppointmentsClient from "@/components/appointments/AppointmentsClient";
import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

function SchedulePageContent() {
  return (
    <AppLayout>
      <main className="p-8">
        <AppointmentsClient />
      </main>
    </AppLayout>
  );
}

export default function SchedulePage() {
    return (
        <AuthGuard>
            <SchedulePageContent />
        </AuthGuard>
    )
}
