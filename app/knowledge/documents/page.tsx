import DashboardShell from "@/components/layout/dashboard-shell";
import DocumentsPageClient from "./documents-client";

export default function DocumentsPage() {
  return (
    <DashboardShell title="Documents">
      <DocumentsPageClient />
    </DashboardShell>
  );
}
