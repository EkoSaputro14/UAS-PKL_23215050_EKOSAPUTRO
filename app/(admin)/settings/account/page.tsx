import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function AccountSettingsPage() {
  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Akun
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pengaturan akun akan tersedia di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
