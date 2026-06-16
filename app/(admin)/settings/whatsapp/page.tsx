import { WhatsAppSettings } from "@/components/whatsapp/whatsapp-settings";

export const metadata = {
  title: "WhatsApp Settings | MimoNotes",
};

export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
        <p className="text-muted-foreground">
          Konfigurasi WhatsApp Business API untuk menerima dan mengirim pesan otomatis.
        </p>
      </div>
      <WhatsAppSettings />
    </div>
  );
}
