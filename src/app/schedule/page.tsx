import { AppLayout } from "@/components/layout/AppLayout";
import AppointmentsClient from "@/components/appointments/AppointmentsClient";
import React from "react";

export default function SchedulePage() {
  return (
    <AppLayout>
      <main className="p-8">
        <AppointmentsClient />
      </main>
    </AppLayout>
  );
}
