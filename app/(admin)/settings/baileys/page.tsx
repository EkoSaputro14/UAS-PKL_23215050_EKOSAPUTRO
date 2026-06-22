import SettingsLayout from "@/components/settings/settings-layout";
import { BaileysSettings } from "@/components/whatsapp/baileys-settings";

export const metadata = {
  title: "Baileys WhatsApp | MimoNotes",
};

export default function BaileysSettingsPage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>
      <div id="main-content" tabIndex={-1}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Baileys WhatsApp</h2>
            <p className="text-muted-foreground">
              Hubungkan WhatsApp menggunakan Baileys (unofficial API) untuk menerima dan mengirim pesan otomatis.
            </p>
          </div>
          <BaileysSettings />
        </div>
      </div>
    </SettingsLayout>
  );
}
