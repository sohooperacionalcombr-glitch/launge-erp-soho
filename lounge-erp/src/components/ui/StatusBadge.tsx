import { STATUS_CONFIG } from "@/lib/utils";
import type { ReservaStatus } from "@/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ReservaStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendente;
  return (
    <span className={cn("status-badge", config.bg, config.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
