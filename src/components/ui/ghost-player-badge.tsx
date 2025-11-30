import { Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

interface GhostPlayerBadgeProps {
  className?: string;
}

export function GhostPlayerBadge({ className }: GhostPlayerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400",
        className
      )}
    >
      <Ghost className="h-3 w-3" />
      Invitado
    </span>
  );
}

