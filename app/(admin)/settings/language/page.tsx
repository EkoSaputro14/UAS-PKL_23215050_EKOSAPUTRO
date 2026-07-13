import SettingsLayout from "@//components/settings/settings-layout";
import LanguageSelector from "@//components/settings/language-selector";

export default function LanguagePage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bahasa / Language</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih bahasa yang digunakan di seluruh aplikasi.
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <LanguageSelector />
        </div>
      </div>
    </SettingsLayout>
  );
}
