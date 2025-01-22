import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4 w-full">
      <Link href={"/ficheInscriptionCinquieme"}>ficheInscriptionCinquieme</Link>
      <Link href={"/ficheInscriptionPremiereGenerale"}>ficheInscriptionPremiereGenerale</Link>
      <Link href={"/ficheInscriptionPremiereST2S"}>ficheInscriptionPremiereST2S</Link>
      <Link href={"/ficheInscriptionQuatrieme"}>ficheInscriptionQuatrieme</Link>
      <Link href={"/ficheInscriptionSeconde"}>ficheInscriptionSeconde</Link>
      <Link href={"/ficheInscriptionSixieme"}>ficheInscriptionSixieme</Link>
      <Link href={"/ficheInscriptionTerminaleGenerale"}>ficheInscriptionTerminaleGenerale</Link>
      <Link href={"/ficheInscriptionTerminaleST2S"}>ficheInscriptionTerminaleST2S</Link>
      <Link href={"/ficheInscriptionTerminaleST2S"}>ficheInscriptionTroisieme</Link>
      <Link href={"/recapitulatifScolarite"}>recapitulatifScolarite</Link>
      <Link href={"/portesOuvertesSVG"}>portesOuvertes</Link> 
    </main>
  );
}
