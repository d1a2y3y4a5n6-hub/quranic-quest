import {
  Camera,
  Ghost,
  MessageCircle,
  Music2,
  Play,
  Send,
  Tv,
} from "lucide-react";

const icons = {
  Instagram: Camera,
  TikTok: Music2,
  YouTube: Play,
  Snapchat: Ghost,
  X: Send,
  Netflix: Tv,
  Reddit: MessageCircle,
  WhatsApp: MessageCircle,
};

export function AppIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? MessageCircle;
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}