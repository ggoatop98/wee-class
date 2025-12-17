
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AccountClient from "@/components/account/AccountClient";

function AccountPageContent() {
  return (
    <AppLayout>
      <main className="p-8">
        <AccountClient />
      </main>
    </AppLayout>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountPageContent />
    </AuthGuard>
  );
}
