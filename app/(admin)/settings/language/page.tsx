import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function LanguageSettingsPage() {
  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Bahasa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pengaturan bahasa akan tersedia di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
