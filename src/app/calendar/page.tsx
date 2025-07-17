import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import React from "react";

export default function CalendarPage() {
  return (
    <AppLayout>
      <main className="p-8">
        <CalendarView />
      </main>
    </AppLayout>
  );
}
