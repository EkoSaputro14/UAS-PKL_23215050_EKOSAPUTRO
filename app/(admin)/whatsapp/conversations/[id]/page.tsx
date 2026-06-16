import { ChatView } from "@/components/whatsapp/chat-view";

export const metadata = {
  title: "Percakapan WhatsApp | MimoNotes",
};

export default async function WhatsAppConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ChatView conversationId={id} />;
}
