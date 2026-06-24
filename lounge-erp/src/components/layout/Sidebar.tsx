"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Armchair,
  CalendarCheck,
  Calendar,
  Grid,
  LogOut,
  ChevronRight,
  Zap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard",               label: "Início",     icon: LayoutDashboard },
  { href: "/dashboard/portaria",      label: "Portaria",   icon: ShieldCheck     },
  { href: "/dashboard/reservas",      label: "Reservas",   icon: CalendarCheck   },
  { href: "/dashboard/mapa-reservas", label: "Mapa",       icon: Grid            },
  { href: "/dashboard/financeiro",    label: "Financeiro", icon: TrendingUp      },
  { href: "/dashboard/clientes",      label: "Clientes",   icon: Users           },
  { href: "/dashboard/eventos",       label: "Eventos",    icon: Calendar        },
  { href: "/dashboard/camarotes",     label: "Camarotes",  icon: Armchair        },
  { href: "/dashboard/calendario",    label: "Calendário", icon: CalendarCheck   },
];

// 5 itens principais da barra inferior mobile (fluxo da noite do evento)
const mobileNavItems = [
  { href: "/dashboard/mapa-reservas",   label: "Início",     icon: LayoutDashboard },
  { href: "/dashboard/portaria",        label: "Portaria",   icon: ShieldCheck     },
  { href: "/dashboard/reservas/rapida", label: "Rápida",     icon: Zap             },
  { href: "/dashboard/financeiro",      label: "Financeiro", icon: TrendingUp      },
  { href: "/dashboard/reservas",        label: "Reservas",   icon: CalendarCheck   },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Até logo!");
    router.push("/login");
  }

  function isActive(href: string) {
    // "/dashboard" e "/dashboard/mapa-reservas" são a mesma tela inicial
    if (href === "/dashboard" || href === "/dashboard/mapa-reservas") {
      return pathname === "/dashboard" || pathname === "/dashboard/mapa-reservas";
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Topo mobile (< lg) ──────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-night-800 border-b border-night-700 flex items-center px-4">
        <div>
          <p className="text-night-400 text-[9px] uppercase tracking-[0.3em] leading-none">
            Gestão
          </p>
          <h1 className="font-display text-lg font-bold text-white leading-tight">
            Soho
          </h1>
        </div>
      </header>

      {/* ── Sidebar desktop (≥ lg) ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full bg-night-800 border-r border-night-700 flex-col z-20 w-[240px]">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-night-700">
          <p className="text-night-400 text-[10px] uppercase tracking-[0.3em] mb-0.5">
            Gestão
          </p>
          <h1 className="font-display text-xl font-bold text-white tracking-tight">
            Soho
          </h1>
          <div className="mt-2 w-6 h-0.5 bg-brand-500 rounded-full" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                    : "text-night-300 hover:text-white hover:bg-night-700"
                )}
              >
                <Icon
                  size={17}
                  className={active ? "text-brand-400" : "text-night-400 group-hover:text-white"}
                />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="text-brand-400/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-night-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-night-400 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Barra inferior mobile (< lg) ────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-night-800 border-t border-night-700">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  active ? "text-brand-400" : "text-night-500 active:text-night-200"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
