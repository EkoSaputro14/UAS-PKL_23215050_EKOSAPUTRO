import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun } from "lucide-react";

export default function AppearanceSettingsPage() {
  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Tampilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pengaturan tampilan akan tersedia di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
