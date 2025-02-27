import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-6 p-6 w-full mx-auto max-w-[1000px] md:pt-[13vh] sm:pt-[13vh]">
      <section className="space-y-4">
      <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            École
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li className="flex gap-4">
              <p>Récapitulatif de scolarité :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Re%CC%81capitulatif+de+scolarite%CC%81.pdf"}>Version numérique</Link>
            </li>
          </ul>
        </details>
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">Collège</summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Sixièmes :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Sixi%C3%A8me.pdf"}>Version à imprimer</Link>
              <p>Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Cinquièmes :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Cinqui%C3%A8me.pdf"}>Version à imprimer</Link>
              <p>Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Quatrièmes :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Quatri%C3%A8me.pdf"}>Version à imprimer</Link>
              <p>Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Troisièmes :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Troisi%C3%A8me.pdf"}>Version à imprimer</Link>
              <p>Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Récapitulatif de scolarité :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Re%CC%81capitulatif+de+scolarite%CC%81.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Attestation Savoir Nager :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Attestation+Savoir+Nager.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Option Chorale :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Option+Chorale.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Option Théatre :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Option+Th%C3%A9atre.pdf"}>Version numérique</Link>
            </li>
          </ul>
        </details>
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            Lycée
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Secondes :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Seconde.pdf"}>Version à imprimer</Link>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Seconde+Num%C3%A9rique.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Premières Générales :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Premi%C3%A8re+G%C3%A9n%C3%A9rale.pdf"}>Version à imprimer</Link>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Premie%CC%80re+Ge%CC%81ne%CC%81rale+Num%C3%A9rique.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Premières ST2S :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Premi%C3%A8re+ST2S.pdf"}>Version à imprimer</Link>
              <p >Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Terminales Générales :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Terminale+G%C3%A9n%C3%A9rale.pdf"}>Version à imprimer</Link>
              <p >Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Fiche d&apos;Inscription des Terminales ST2S :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Terminale+ST2S.pdf"}>Version à imprimer</Link>
              <p >Version numérique</p>
            </li>
            <li className="flex gap-4">
              <p>Récapitulatif de scolarité :</p>
              <p>Version à imprimer</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Re%CC%81capitulatif+de+scolarite%CC%81.pdf"}>Version numérique</Link>
            </li>
            <li className="flex gap-4">
              <p>Autorisation de sortie élèves :</p>
              <Link className="text-blue-500 hover:underline" href={"/documents/autorisationSortie"}>Version numérique</Link>
            </li>
          </ul>
        </details>
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            Professeurs
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li className="flex gap-4">
              <p>Demande de prise en charge partielle du prix des titres de transport :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/documents/professeurs/Demande+de+prise+en+charge+partielle+du+prix+des+titres+de+transport.pdf"}>Version à imprimer</Link>
            </li>
            <li className="flex gap-4">
              <p>Demande d&apos;autoristation de cumul d&apos;activites :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/documents/professeurs/Demande+d'autoristation+de+cumul+d'activites.pdf"}>Version à imprimer</Link>
            </li>
            <li className="flex gap-4">
              <p>Demande de photocopies couleur :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/documents/professeurs/Demande+de+photocopies+couleur.pdf"}>Version à imprimer</Link>
            </li>
            <li className="flex gap-4">
              <p>Demande autorisation d&apos;absence :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/documents/professeurs/Demande+autorisation+d'absence.pdf"}>Version à imprimer</Link>
            </li>
            <li className="flex gap-4">
              <p>Commande de cuisine déplacement :</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/documents/professeurs/Commande+de+cuisine+d%C3%A9placement.pdf"}>Version à imprimer</Link>
            </li>
          </ul>
        </details>
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            Comptabilité, RH
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            
          </ul>
        </details>
      </section>
    </main>
  );
}
