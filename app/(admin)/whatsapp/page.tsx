import { ConversationList } from "@/components/whatsapp/conversation-list";

export const metadata = {
  title: "WhatsApp | MimoNotes",
};

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
        <p className="text-muted-foreground">
          Kelola percakapan WhatsApp dan pantau lead dari pelanggan.
        </p>
      </div>
      <ConversationList />
    </div>
  );
}
