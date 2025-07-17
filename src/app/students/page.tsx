import { AppLayout } from "@/components/layout/AppLayout";
import StudentsClient from "@/components/students/StudentsClient";
import React from "react";

export default function StudentsPage() {
  return (
    <AppLayout>
      <main className="p-8">
        <StudentsClient />
      </main>
    </AppLayout>
  );
}
