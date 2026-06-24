import { redirect } from "next/navigation";

// Tela inicial do sistema → Mapa Operacional
export default function DashboardPage() {
  redirect("/dashboard/mapa-reservas");
}
