import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsSettingsPage() {
  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pengaturan notifikasi akan tersedia di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
