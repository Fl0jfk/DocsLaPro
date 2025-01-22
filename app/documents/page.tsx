import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-6 p-6 w-1/2 mx-auto">
      <section className="space-y-4">
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            Collège
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li className="flex gap-10">
              <p>Fiche d'Inscription des Sixièmes</p>
              <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Fiche+Inscription+Sixi%C3%A8me.pdf"}>Version à imprimer</Link>
              <Link href={"/"}>Version numérique</Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionCinquieme"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionCinquieme
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionQuatrieme"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionQuatrieme
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionTroisieme"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionTroisieme
              </Link>
            </li>
          </ul>
        </details>

        {/* Lycée */}
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            Lycée
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li>
              <Link
                href={"/ficheInscriptionSeconde"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionSeconde
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionPremiereGenerale"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionPremiereGenerale
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionPremiereST2S"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionPremiereST2S
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionTerminaleGenerale"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionTerminaleGenerale
              </Link>
            </li>
            <li>
              <Link
                href={"/ficheInscriptionTerminaleST2S"}
                className="text-blue-500 hover:underline"
              >
                ficheInscriptionTerminaleST2S
              </Link>
            </li>
          </ul>
        </details>

        {/* École */}
        <details className="group bg-white rounded-lg shadow-md">
          <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
            École
          </summary>
          <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
            <li>
              <Link
                href={"/recapitulatifScolarite"}
                className="text-blue-500 hover:underline"
              >
                recapitulatifScolarite
              </Link>
            </li>
            <li>
              <Link
                href={"/portesOuvertesSVG"}
                className="text-blue-500 hover:underline"
              >
                portesOuvertes
              </Link>
            </li>
          </ul>
        </details>
      </section>
    </main>
  );
}
