import Image from "next/image"
import Link from "next/link"

export default function Page (){
    const demande ="https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/VoyagesTransports/Demande+de+voyages.jpg"
    return (
        <main className="p-4 text-xl flex flex-col gap-6 items-center justify-center md:pt-[10vh] sm:pt-[10vh]">
            <h1 className="text-6xl underline font-bold">Le transport des voyages</h1>
            <p>Recevoir une demande par un prof pour une sortie scolaire demander au prof un maximum de détails sur sa sortie. (micro, transfert entre les monuments, horaires souhaitées etc )</p>
            <Image src={demande} alt="" width={500} height={500}></Image>
            <p>Préparer les demandes de devis aux sociétés et les imprimer afin de créer une pochette dans le classeur Voyages au secrétariat lycée.</p>
            <Link href={"/documents/devisTransport"} className="text-blue-500 hover:underline">Vous pouvez préparer vos demandes en cliquant sur ce lien et imprimer directement depuis le site en PDF</Link>
            <p>Envoyer les devis par mail aux sociétés</p>
            <p>Imprimer chaque devis reçus par les sociétés et les ranger dans le classeur.</p>
            <p>Envoyer les prix des différentes compagnies et donner les caractéristiques des transports aux professeurs afin qu&apos;il fasse son choix (chauffeur à héberger et nourrir par exemple).</p>
            <p>Une fois le professeur revenu vers nous, faire signé par la directrice de l&apos;établissement lié le devis choisi.</p>
            <p>Confirmer le devis auprès de la compagnie choisie par mail en leur envoyant une confirmation de devis.</p>
            <p>Une fois que la compagnie a confirmé l&apos;enregistrement de la commande, envoyé le devis et la confirmation à la Comptabilité Cécile ou déposé sur Zeendoc si on a l&apos;accés.</p>
            <p>Signifié aux autres compagnies que nous ne donneront pas suite à leur devis.</p>
            <p>Se mettre un rappel une semaine avant la sortie afin de transmettre aux transporteur la liste des élèves et accompagnateur et un autre rappel 3 jours avant afin de demander au transporteur le nom et numéro de téléphone du chauffeur (la transmettre au prof qui gère la sortie).</p>
        </main>
    )
}