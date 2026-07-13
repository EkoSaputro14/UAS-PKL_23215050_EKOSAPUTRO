import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Keamanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pengaturan keamanan akan tersedia di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
