"use client";

type RequestStatus = "NOUVELLE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

type SubmittedRequest = {
  id: string;
  status: RequestStatus;
  category: string;
  subject: string;
  description: string;
  assignedTo: {
    routeId?: string;
    unit: string;
    roleLabel: string;
  };
};

const STATUS_STYLE: Record<RequestStatus, string> = {
  NOUVELLE: "bg-amber-100 text-amber-900 border-amber-200",
  EN_COURS: "bg-sky-100 text-sky-900 border-sky-200",
  EN_ATTENTE: "bg-violet-100 text-violet-900 border-violet-200",
  TERMINEE: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

export default function MesDemandesSuivi({
  items,
  loading,
  id = "mes-demandes",
  title = "Mes demandes (suivi)",
  intro = "Demandes que vous avez déposées via le chatbot : statut et service qui traite votre demande.",
}: {
  items: SubmittedRequest[];
  loading: boolean;
  id?: string;
  title?: string;
  intro?: string;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-slate-200 pt-10">
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600 mt-1 max-w-2xl">{intro}</p>
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Chargement du suivi…</p>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
          Aucune demande enregistrée avec votre compte ou votre email pour le moment.
        </div>
      ) : (
        <ul className="mt-6 space-y-3 max-w-3xl">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300/90 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.category}</p>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{r.subject}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3">{r.description}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">ID {r.id}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border ${STATUS_STYLE[r.status]}`}
                >
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-snug">
                <span className="font-semibold text-slate-800">Service qui traite la demande :</span> {r.assignedTo.roleLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
