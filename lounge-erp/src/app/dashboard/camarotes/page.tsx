import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Armchair, Users, MapPin } from "lucide-react";

export default async function CamarotesPage() {
  const supabase = await createClient();

  const { data: camarotes } = (await supabase
    .from("camarotes")
    .select("*")
    .order("nome")) as any;

  const grupos = {
    Gold: camarotes?.filter((c: any) => c.nome.startsWith("Gold")) ?? [],
    "Dom Julio": camarotes?.filter((c: any) => c.nome.startsWith("Dom Julio")) ?? [],
    Lounge: camarotes?.filter((c: any) => c.nome.startsWith("Lounge")) ?? [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-night-400 text-xs uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="font-display text-3xl font-bold text-white">Camarotes</h1>
        </div>
        <div className="text-right">
          <p className="text-night-400 text-xs">Total</p>
          <p className="text-white font-bold text-2xl">{camarotes?.length ?? 0}</p>
        </div>
      </div>

      {/* Grupos */}
      {Object.entries(grupos).map(([grupo, items]) =>
        items.length === 0 ? null : (
          <div key={grupo}>
            <h2 className="text-night-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-night-600" />
              {grupo}
              <span className="w-4 h-px bg-night-600" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((c: any) => (
                <div
                  key={c.id}
                  className={`card p-5 transition-colors ${
                    c.ativo
                      ? "hover:border-night-600"
                      : "opacity-50 border-dashed"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <Armchair size={17} className="text-brand-400" />
                    </div>
                    {!c.ativo && (
                      <span className="text-xs text-night-500 bg-night-700 px-2 py-0.5 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-semibold text-white text-lg mb-1">
                    {c.nome}
                  </h3>

                  {c.descricao && (
                    <p className="text-night-400 text-xs mb-3">{c.descricao}</p>
                  )}

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-night-700">
                    <div className="flex items-center gap-2 text-xs text-night-300">
                      <Users size={12} className="text-night-500" />
                      <span>Capacidade: {c.capacidade} pessoas</span>
                    </div>
                    {c.localizacao && (
                      <div className="flex items-center gap-2 text-xs text-night-300">
                        <MapPin size={12} className="text-night-500" />
                        <span>{c.localizacao}{c.andar ? ` · ${c.andar}` : ""}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-night-700">
                    <p className="text-xs text-night-500">Preço base</p>
                    <p className="text-brand-400 font-semibold">
                      {formatCurrency(c.preco_base)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
