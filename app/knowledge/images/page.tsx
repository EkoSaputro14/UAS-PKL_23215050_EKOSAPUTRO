import DashboardShell from "@/components/layout/dashboard-shell";
import ImagesPageClient from "./images-client";

export default function ImagesPage() {
  return (
    <DashboardShell title="Images">
      <ImagesPageClient />
    </DashboardShell>
  );
}
