import { AppLayout } from "@/components/layout/AppLayout";
import StudentsClient from "@/components/students/StudentsClient";
import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

function StudentsPageContent() {
  return (
    <AppLayout>
      <main className="p-8">
        <StudentsClient />
      </main>
    </AppLayout>
  );
}

export default function StudentsPage() {
    return (
        <AuthGuard>
            <StudentsPageContent />
        </AuthGuard>
    )
}
