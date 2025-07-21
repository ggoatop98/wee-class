import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

function CalendarPageContent() {
  return (
    <AppLayout>
      <main className="p-8">
        <CalendarView />
      </main>
    </AppLayout>
  );
}


export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarPageContent />
    </AuthGuard>
  )
}
