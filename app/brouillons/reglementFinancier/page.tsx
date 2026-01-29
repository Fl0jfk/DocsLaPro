import Image from "next/image";

export default function ReglementFinancier() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-10 bg-white text-slate-800 font-sans shadow-2xl my-10 rounded-sm border border-slate-100" id="mon-flyer-a-imprimer">
      <header className="flex justify-between items-end pb-4 mb-4">
          <Image src={"/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"} width={110} height={110} alt="logo"/>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Règlement Financier</h1>
            <p className="text-xl font-bold text-blue-700 tracking-widest">ANNÉE SCOLAIRE 2026 / 2027</p>
          </div>
      </header>
      <section className="mb-4">
        <div className="bg-slate-900 text-white p-3 mb-4 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">01. Contribution Familiale Mensuelle (sur 10 mois)</h2>
        </div>
        <div className="overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] uppercase font-black text-slate-600 border-b border-slate-300">
                <th className="p-4 border-r border-slate-200">Catégories (Quotient Familial)</th>
                <th className="px-1 py-4 text-center">Maternelle</th>
                <th className="px-1 py-4 text-center">Élémentaire</th>
                <th className="p-4 text-center">Collège</th>
                <th className="p-4 text-center">Lycée</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200">
              {[
                { cat: "1 - QF > 14 660 €", m: "132", e: "139", c: "164", l: "164" },
                { cat: "2 - QF de 10 930 € à 14 660 €", m: "117", e: "124", c: "149", l: "149" },
                { cat: "3 - QF de 6 920 € à 10 930 €", m: "109", e: "118", c: "140", l: "140" },
                { cat: "4 - QF de 4 610 € à 6 920 €", m: "87", e: "97", c: "112", l: "112" },
                { cat: "5 - QF < 4 610 €", m: "35", e: "35", c: "45", l: "55", },
              ].map((row, i) => (
                <tr key={i} >
                  <td className="p-3 border-r border-slate-200">{row.cat}</td>
                  <td className="text-center">{row.m} €</td>
                  <td className="text-center">{row.e} €</td>
                  <td className="text-center">{row.c} €</td>
                  <td className="text-center">{row.l} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-600 bg-slate-50 px-4 py-2 border border-slate-100 italic">
          <p>• La contribution est modulée selon la composition familiale et les revenus.</p>
          <p>• <strong>Réduction Fratrie :</strong> -10% pour 3 enfants scolarisés dans l&apos;établissement.</p>
          <p>• <strong>Gratuité :</strong> Accordée à compter du 5ème enfant scolarisé.</p>
        </div>
      </section>

      {/* 02. RESTAURATION (DEMI-PENSION & PENSION) */}
      <section className="mb-4">
        <div className="bg-slate-900 text-white p-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest">02. Restauration et Pension Mensuelle (sur 10 mois)</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 overflow-hidden border border-slate-200">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-slate-100 uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left">Forfaits Demi-Pension</th>
                  <th className="p-3">Mat.</th><th className="p-3">Elem.</th><th className="p-3">Coll.</th><th className="p-3">Lyc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center text-sm">
                <tr><td className="p-2 text-left font-semibold italic">1 repas / semaine</td><td>21 €</td><td>25 €</td><td>25 €</td><td>26 €</td></tr>
                <tr><td className="p-2 text-left font-semibold italic">2 repas / semaine</td><td>43 €</td><td>50 €</td><td>50 €</td><td>52 €</td></tr>
                <tr><td className="p-2 text-left font-semibold italic">3 repas / semaine</td><td>64 €</td><td>74 €</td><td>75 €</td><td>77 €</td></tr>
                <tr><td className="p-2 text-left font-semibold italic">4 repas / semaine</td><td>85 €</td><td>99 €</td><td>100 €</td><td>103 €</td></tr>
                <tr className="bg-slate-50 font-bold"><td className="p-2 text-left uppercase">5 repas / semaine</td><td>-</td><td>-</td><td>125 €</td><td>129 €</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-slate-100 p-4 flex flex-col justify-center border-l-4 border-slate-900">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold uppercase">Forfait PENSION</span>
              <span className="text-slate-900 text-sm">589 € <small className="text-sm">/mois</small></span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Comprend la demi-pension</span>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Uniquement Collège et Lycée</p>
          </div>
        </div>
        <div className="mt-4 px-4 py-2 border-2 border-slate-100 rounded text-[11px] leading-relaxed">
          <p className="mb-2"><strong>Notes Demi-Pension :</strong> Une contribution d&apos;accueil sera facturée aux élèves amenant leur panier repas dans le cadre d&apos;un <strong>PAI uniquement (forfait 145 € annuel)</strong>.</p>
          <p><strong>Conditions d&apos;absence :</strong> Remboursement de la part variable après 7 jours calendaires consécutifs d&apos;absence justifiée : <strong>3,40 €</strong> (repas) ou <strong>8,50 €</strong> (internat) par jour ouvré.</p>
        </div>
      </section>
      <div className="flex flex-col gap-4 pt-8">
        <section>
          <div className="bg-slate-900 text-white p-3 mb-4"><h2 className="text-sm font-bold uppercase tracking-widest">03. Étude ou Garderie Mensuelle (sur 10 mois)</h2></div>
          <div className="space-y-2 px-4 py-2 border border-slate-200 rounded text-sm">
            <div className="flex justify-between"><span>1 jour / semaine</span><strong>15,50 €</strong></div>
            <div className="flex justify-between border-y border-slate-50 py-1"><span>2 jours / semaine</span><strong>31,00 €</strong></div>
            <div className="flex justify-between border-b border-slate-50 pb-1"><span>3 jours / semaine</span><strong>46,50 €</strong></div>
            <div className="flex justify-between"><span>4 jours / semaine</span><strong>62,00 €</strong></div>
          </div>
        </section>
        <section>
          <div className="bg-slate-900 text-white p-3 mb-4"><h2 className="text-sm font-bold uppercase tracking-widest">04. Cotisations & Inscriptions Mensuelle (sur 10 mois)</h2></div>
          <div className="grid grid-cols-4 gap-4 text-[10px] uppercase font-bold">
            <div className="bg-slate-50 p-3">Pôle Culturel Collège<br/><span className="text-sm">0,50 €</span></div>
            <div className="bg-slate-50 p-3">Pôle Culturel Lycée<br/><span className="text-sm">1,50 €</span></div>
            <div className="bg-slate-100 p-3 text-blue-800">A.P.E.L. (par Famille)<br/><span className="text-sm">1,604 €</span><span className="ml-12 text-[7px]">facultative</span></div>
            <div className="bg-slate-100 p-3 text-blue-800">Assurance Scolaire<br/><span className="text-sm">0,85 €</span><span className="ml-12 text-[7px]">facultative</span></div>
          </div>
        </section>
      </div>
      <div className="mt-4 flex justify-center">
        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 px-6 py-2 w-full border border-slate-200 rounded-sm text-center">Le forfait mensuel est dû pour tout mois commencé, sans possibilité de remboursement au prorata des jours de présence.</p>
      </div>
      <section className="mb-4 bg-slate-50 px-8 pb-4 pt-4 mt-4 border border-slate-200">
        <h2 className="text-sm font-black uppercase mb-2 flex items-center gap-3">
          <span className="h-px bg-slate-900 flex-1"></span>
          Informations Pratiques
          <span className="h-px bg-slate-900 flex-1"></span>
        </h2>
        <div className="flex flex-col gap-2 text-[12px] leading-relaxed max-w-3xl mx-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
              <p className="font-black uppercase text-blue-700 tracking-wider">Inscriptions / Réinscriptions</p>
            </div>
            <ul className="space-y-1 pl-8">
              <li>• <strong>Première demande :</strong> 50 € de frais de dossier à régler sur Ecole Directe.</li>
              <li>• <strong>Réinscription 2026/2027 :</strong> Acompte de <strong>80 €</strong> (externe/DP) ou <strong>500 €</strong> (interne) prélevé en juin 2026.</li>
              <li>• Cet acompte n&apos;est pas remboursé en cas de désistement ou si l&apos;élève quitte l&apos;établissement en cours d&apos;année.</li>
            </ul>
            <div className="p-3 mt-2 ml-8 bg-white border-2 border-blue-100 rounded-xl shadow-sm max-w-lg w-full">
              <p className="font-black uppercase text-[10px] mb-1 text-slate-400">Gestionnaires réinscriptions :</p>
              <div className="flex gap-4 items-center">
                <p className="text-md font-black text-slate-900 uppercase leading-none">Pauline LEBLOND</p>
                <a href="mailto:pauline.leblond@ac-normandie.fr" className="text-blue-600 font-bold">pauline.leblond@ac-normandie.fr</a>
              </div>
              <div className="flex gap-4 items-center">
                <p className="text-md font-black text-slate-900 uppercase leading-none">Florian HACQUEVILLE-MATHI</p>
                <a href="mailto:florian.hacqueville-mathi@ac-normandie.fr" className="text-blue-600 font-bold">florian.hacqueville-mathi@ac-normandie.fr</a>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
              <p className="font-black uppercase text-blue-700 tracking-wider">Facturation & Règlements</p>
            </div>
            <div className="pl-8">
              <p className="mb-2">
                Les factures sont établies <strong>fin septembre</strong>. Le règlement s&apos;effectue par prélèvements mensuels d&apos;octobre 2026 à juillet 2027 entre le 1er et le 5ème jour ouvré du mois.
              </p>
              <div className="p-3 bg-white border-2 border-blue-100 rounded-xl shadow-sm max-w-md">
                <p className="font-black uppercase text-[10px] mb-1 text-slate-400">Responsable Facturation :</p>
                <div className="flex gap-4 items-center">
                  <p className="text-md font-black text-slate-900 uppercase leading-none">Anaïs BOUTIGNY</p>
                  <a href="mailto:anais.boutigny@laprovidence-nicolasbarre.fr" className="text-blue-600 font-bold">anais.boutigny@laprovidence-nicolasbarre.fr</a>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
              <p className="font-black uppercase text-blue-700 tracking-wider">Aides & Bourses Scolaires</p>
            </div>
            <div className="pl-8">
              <p className="mb-2">Le collège et le lycée sont habilités à recevoir les <strong>élèves boursiers</strong> de l&apos;Éducation Nationale.</p>
              <div className="p-3 bg-white border-2 border-blue-100 rounded-xl shadow-sm max-w-md">
                <p className="font-black uppercase text-[10px] mb-1 text-slate-400">Gestionnaire Bourses :</p>
                <div className="flex gap-4 items-center">
                  <p className="text-md font-black text-slate-900 uppercase leading-none">Karine PERRIER</p>
                  <a href="mailto:karine.perrier@ac-normandie.fr" className="text-blue-600 font-bold ">karine.perrier@ac-normandie.fr</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-[11px] justify-between w-full mx-auto pt-4 px-4">
          <div className="space-y-1">
            <p className="font-black uppercase text-slate-400">Direction École</p>
            <p className="font-bold text-sm">Mme Elise PLANTEC</p>
            <a href="mailto:0762041f@ac-normandie.fr" className="text-blue-700 font-medium">0762041f@ac-normandie.fr</a>
          </div>
          <div className="space-y-1 border-x border-slate-200 px-6">
            <p className="font-black uppercase text-slate-400">Direction Collège</p>
            <p className="font-bold text-sm">Mme Anne-Sophie DUMOUCHEL</p>
            <a href="mailto:0762565a@ac-normandie.fr" className="text-blue-700 font-medium">0762565a@ac-normandie.fr</a>
          </div>
          <div className="space-y-1">
            <p className="font-black uppercase text-slate-400">Direction Lycée</p>
            <p className="font-bold text-sm">Mme Anne-Marie DONA</p>
            <a href="mailto:0761713z@ac-normandie.fr" className="text-blue-700 font-medium">0761713z@ac-normandie.fr</a>
          </div>
        </div>
        <div className="text-center flex flex-row-reverse items-center justify-center gap-2 mt-4">
          <div className="text-[14px] font-black tabular-nums tracking-widest text-slate-900">02.32.86.50.90</div>
          <p className="text-[14px] font-bold uppercase text-slate-400 tracking-widest">Ligne Directe Standard</p>
        </div>
      </section>
    </div>
  );
}