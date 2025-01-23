import Image from "next/image"
import Link from "next/link"

export default function Page (){
    const cumul = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Exemple+Tutos+Cumul+Par+Consommateur.jpg"
    const listRetournée = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Liste+des+profs+envoy%C3%A9e+par+Madi+Samir.jpg"
    const reglages = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/R%C3%A9glages+Cumul+par+consommateur.png"
    const select = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Selections+des+consommateurs.png"
    const selectProf = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/selection+des+profs.png"
    const modeleFact = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Exemple+Facture+Chorus+%C3%A0+envoyer.jpg"
    const seco = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Se+connecter.jpg"
    const dom = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Choix+du+dom.jpg"
    const choixcat = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Choix+du+domaine.jpg"
    const depotFact = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Depot+facture.jpg"
    const a1 = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Bien+mettre+A1+en+code+facture.jpg"
    const etat = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Mettre+etat+et+code+service.jpg"
    const encaissement = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Mettre+facture+et+tva+sur+les+encaissements.jpg"
    const tva0 = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Mettre+TVA+a+0.jpg"
    const valider = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Confirmer+et+envoyer.jpg"
    const certificat = "https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Certificat+de+depot.jpg"
    return (
        <main className="p-4 text-xl flex flex-col gap-6 items-center justify-center mt-12">
            <h1 className="text-6xl underline font-bold">Le repas des professeurs</h1>
            <section className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
                <h2 className="text-2xl underline">Partie 1 : Etablir un listing des professeurs qui mangent à la cantine et leur grade</h2>
                <p>Se connecter à Charlemagne Passage (Jaune)</p>
                <p>Editions puis Cumul par consommateur</p>
                <p className="text-red-500">Faire un cumul mois par mois !!! Et ne sélectionner que les profs !</p>
                <Image src={reglages} alt="" width={500} height={500}></Image>
                <Image src={select} alt="" width={500} height={500}></Image>
                <Image src={selectProf} alt="" width={500} height={500}></Image>
                <p className="text-red-500 font-bold">Attention ! Les déclarations des repas des profs se font au trimestre sauf Décembre qui se déclarent seul ! ( Septembre - Octobre - Novembre ) - ( Décembre ) - ( Janvier - Février - Mars ) - ( Avril - Mai - Juin )</p>
                <p>Imprimer les listings</p>
                <p>Sur les listings Surligner les profs qui ont prix moyen de 5,43€ et moins !</p>
                <Link href={cumul} className="w-full flex items-center justify-center">
                    <Image src={cumul} alt="" width={500} height={500}/>
                </Link>
                <p>Envoyer à Samir Madi du rectorat la liste des professeurs des professeurs qui mangent chez nous !</p>
                <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Listing+Personnel+vierge.xlsx"}>Cliquer ici pour récupérer le listing vierge, remplir uniquement le nom et prènom des profs qui mangent à la cantine</Link>
                <p>Voici un exemple de liste retournée par Mr Madi</p>
                <Link href={listRetournée} className="w-full flex items-center justify-center">
                    <Image src={listRetournée} alt="" width={500} height={500}/>
                </Link>
                <p className="text-red-500">Mettre en relation les profs qui ont un prix de repas à 5,43€ et moins, ils doivent avoir un grade de maximum 534 !</p>
                <p className="text-red-500">Si ils ont un grade supérieur à 534, le déclarer en comptabilité car ils bénéficient d&apos;un prix avantageux alors qui&apos;ils ont un grade trop élévé !</p>
            </section>
            <section className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
                <h2 className="underline text-2xl">Partie 2 : Préparer et envoyer la facture sur Chorus</h2>
                <Link className="text-blue-500 hover:underline" href={"https://docslapro.s3.eu-west-3.amazonaws.com/Tutos/Repas+Profs/Mod%C3%A8le+facture+envoyer+sur+Chorus.xlsx"}>Télécharger le modèle de la facture</Link>
                <Link href={modeleFact} className="w-full flex items-center justify-center">
                    <Image src={modeleFact} alt="" width={500} height={500}/>
                </Link>
                <p className="text-red-500">Attention ne pas rajouter de ligne sur la facture pour rajouter des profs sur le fichier excel ci-dessus il existe plusieurs onglets si la liste est trop grande pour l&apos;onglet 1 !</p>
                <p>Bien faire signer et tamponner le document comme sur l'exemple.</p>
                <Link className="text-blue-500 hover:underline" href={"https://portail.chorus-pro.gouv.fr/aife_csm/fr"}>Se connecter à Chorus</Link>
                <p>Cliquez sur se connecter.</p>
                <Image src={seco} alt="" width={500} height={500}/>
                <Image src={dom} alt="" width={500} height={500}/>
                <p>Choisir Facturation.</p>
                <Image src={choixcat} alt="" width={500} height={500}/>
                <p>Choisir Factures Emises.</p>
                <Image src={depotFact} alt="" width={500} height={500}/>
                <p>Cliquez déposer Facture.</p>
                <p>Charger la facture excel que vous avez préalablement transformer en PDF (bien mettre toutes les pages sur un seul fichier PDF).</p>
                <Image src={a1} alt="" width={1500} height={800} quality={100}/>
                <p>Choisir A1 en cadre de facturation.</p>
                <Image src={etat} alt="" width={1500} height={800} quality={100}/>
                <p>Choisir l'Etat est le destinataire, trouver le code service FAC0000014.</p>
                <Image src={encaissement} alt="" width={1500} height={1000} quality={100}/>
                <p>Nommer sa facture comme sur l'exemple en changeant l'année et le trimestre selon les besoins, choisir en type facture et en type de TVA : TVA sur les encaissements.</p>
                <Image src={tva0} alt="" width={1500} height={800} quality={100}/>
                <p>Bien vérifier que la pièce jointe est présente, mettre le montant calculé sur la facture dans le montant HT, mettre le montant TVA à 0.</p>
                <p>Appuyer sur valider et envoyer.</p>
                <Image src={valider} alt="" width={1500} height={800} quality={100}/>
                <p>Appuyer sur Confirmer et envoyer</p>
                <Image src={certificat} alt="" width={1500} height={800} quality={100}/>
                <p>Imprimer le certificat de dépôt.</p>
                <p className="mb-40">Mettre toutes les pièces justificatives dans la pochette prévue à cet effet au secrétariat lycée. (certificat de dépôt, listing prof, facture envoyer etc)</p>
            </section>
        </main>
    )
}