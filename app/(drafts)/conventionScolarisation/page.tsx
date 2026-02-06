"use client";

import Image from "next/image";

export default function ConventionScolarisation() {
  return (
    <div className="max-w-4xl mx-auto my-10 font-sans text-slate-800 print:my-0">
      <div className="bg-white p-12 border border-slate-200 shadow-2xl min-h-[1100px] print:shadow-none print:border-none">
        
        {/* HEADER OFFICIEL */}
        <div className="flex justify-between items-center border-b-4 border-blue-600 pb-4 mb-4">
          <div className="flex gap-6 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={80} height={80} alt="Logo" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">La Providence Nicolas Barré</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Établissement Catholique d&apos;Enseignement</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-blue-600 uppercase tracking-widest">Convention</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter text-[11px]">De Scolarisation</p>
          </div>
        </div>

        <div className="mb-4 font-sans">
  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-8">
    
    {/* Haut : L'établissement - Version "Blindée" Juridiquement */}
    <div className="flex justify-between items-start border-b border-blue-100 pb-6">
      <div className="space-y-4 flex-1">
        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Entre les soussignés :</p>
        <div>
          <p className="text-[15px] font-black uppercase text-slate-900 leading-tight">
            Ensemble Scolaire La Providence Nicolas Barré
          </p>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">
            ÉCOLE - COLLÈGE - LYCÉE
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-[12px] leading-relaxed text-slate-600">
            <p className="font-bold">SIRET OGEC : <span className="font-mono">781 075 841 00010</span></p>
            <p>6, rue de Neuvillette, 76240 LE MESNIL-ESNARD</p>
          </div>
          <div className="text-[12px] leading-relaxed text-slate-600 border-l border-slate-200 pl-4">
            <p className="font-bold">Représenté par :</p>
            <p className="italic">Le Chef d&apos;Établissement Coordonnateur ou son représentant dûment habilité.</p>
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end shrink-0 ml-4">
        <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full mb-2">CONVENTION CADRE</span>
        <p className="text-[9px] font-black italic text-slate-400 uppercase">A SIGNER PAR VOIE ÉLECTRONIQUE</p>
      </div>
    </div>

    {/* Bas : Encart de saisie pleine largeur */}
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Et le(s) représentant(s) légal(aux) :</p>
        <p className="text-[8px] font-bold text-slate-400 italic underline">DÉSIGNÉ(S) CI-APRÈS &quot;LES PARENTS&quot;</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Ligne Responsables */}
        <div className="border-b-2 border-slate-200 pb-2">
          <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Nom et Prénom du/des responsable(s) :</p>
          <div className="h-8"></div> 
        </div>
        
        {/* Ligne Adresse */}
        <div className="border-b-2 border-slate-200 pb-2">
          <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Adresse complète de résidence :</p>
          <div className="h-8"></div>
        </div>

        {/* Bloc Enfant - Pleine largeur */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm relative overflow-hidden">
          {/* Filigrane discret pour le PDF */}
          <div className="absolute top-0 right-0 bg-blue-50 px-4 py-1 rounded-bl-lg text-[8px] font-black text-blue-400 uppercase">Élève concerné</div>
          
          <p className="text-[8px] uppercase text-blue-600 font-black mb-6 italic">Identification de l&apos;élève scolarisé :</p>
          
          <div className="grid grid-cols-2 gap-12">
            <div className="border-b border-slate-200">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">NOM de l&apos;enfant :</span>
              <div className="h-8"></div> 
            </div>
            <div className="border-b border-slate-200">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">PRÉNOM de l&apos;enfant :</span>
              <div className="h-8"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mt-4">
            <div className="border-b border-slate-200">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Date de naissance :</span>
              <div className="h-8"></div> 
            </div>
            <div className="border-b border-slate-200">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Classe intégrée :</span>
              <div className="h-8"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
          

        {/* CORPS DES ARTICLES */}
        <div className="text-[11.5px] leading-relaxed space-y-4 text-justify">
          <p className="font-black text-center uppercase tracking-widest text-slate-400 mb-4 italic">Il EST CONVENU CE QUI SUIT :</p>

          <div className="space-y-4">
            <section>
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">1</span> 
                Article 1er - Objet de la convention
              </h3>
              <p>La présente convention a pour objet de définir les conditions dans lesquelles l’enfant sera scolarisé par le(s) représentant(s) légal(aux) au sein de l’établissement La Providence – Nicolas Barré ainsi que les droits et les obligations réciproques de chacune des parties.</p>
            </section>

            <section>
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">2</span> 
                Article 2 - Engagements de l’établissement
              </h3>
              <p>L&apos;établissement La Providence – Nicolas Barré s’engage à scolariser l’enfant pour l’année scolaire 2026 – 2027 selon les principes du projet éducatif et pastoral présenté dans le dossier d’inscription et selon le contrat d’association avec l’état garantissant le respect des programmes nationaux. L&apos;établissement s’engage par ailleurs à assurer une prestation de restauration / d’internat / d’étude / de garderie selon les choix définis par les parents.</p>
            </section>

            <section>
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 mt-[200px] pt-[50px] flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">3</span> 
                Article 3 - Engagements des représentants légaux
              </h3>
              <div className="space-y-3">
                <p>Le(s) représentant(s) légal(aux) s’engage(nt) à scolariser régulièrement l’élève en conformité avec les exigences légales d’assiduité au sein de l’établissement La Providence – Nicolas Barré pour l’année scolaire 2026-2027.</p>
                <p>Le(s) représentant(s) légal(aux) reconnaît(ssent) avoir pris connaissance du projet éducatif du règlement intérieur ainsi que ses annexes (charte des options, charte informatique …) de l’établissement La Providence - Nicolas Barré, y adhérer et mettre tout en œuvre afin de les faire respecter.</p>
                <p>Les représentants légaux s’engagent par ailleurs à maintenir une collaboration avec les différents acteurs de l’établissement et à tout mettre en œuvre pour suivre et favoriser l’évolution de l’élève dans l’établissement. Cela implique le suivi régulier de l’élève : signatures des documents, des bulletins, participation aux réunions de parents, aux entretiens individuels, aux suivis spécialisés demandés par l’équipe pédagogique.</p>
                <p>Le(s) représentant(s) légal(aux) s’engage(nt) à soutenir l’établissement dans son action éducative, à ne pas dénigrer l’établissement et la communauté éducative, à ne pas user de la violence sous quelque forme que ce soit.</p>
                <p>Par principe, les représentants légaux exercent conjointement l’autorité parentale, sauf décision de justice contraire communiquée à l’établissement. Afin de favoriser le respect des droits parentaux de chacun, les représentants légaux s’engagent à informer l’établissement de toute modification (amiable ou judiciaire) dans l’exercice de leurs droits et dans la résidence habituelle de l’élève.</p>
                <p className="font-bold text-slate-900 py-4">Nous rappelons que les représentants légaux restent les premiers éducateurs de l’élève.</p>
                <p className="text-[10px] font-black uppercase text-blue-800 italic bg-blue-50 p-2 rounded-lg inline-block mt-4">Cette disposition dans son ensemble constitue une obligation essentielle et déterminante à l’engagement de l’établissement dans le contrat.</p>
              </div>
            </section>

            <section className="pt-6">
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">4</span> 
                Article 4 - Adhésion au règlement financier
              </h3>
              <p className="mb-2">Le coût de la scolarisation comprend plusieurs éléments : la contribution familiale, la demi-pension ou l’internat, les prestations diverses et les adhésions volontaires aux associations tiers (APEL, …), dont le détail et les modalités de paiement figurent dans le règlement financier.</p>
              <p className="mb-2">Les sorties, et activités péri-éducatives ainsi que les voyages auxquels l’enfant sera amené à participer (avec accord de la famille) dans le cadre des projets de l’équipe éducative seront à régler à la demande selon les modalités financières prévues dans les circulaires concernant ces sorties. Pour les parents qui le souhaitent, il est possible de verser un don sous forme d’une contribution volontaire (prendre contact avec le chef d’établissement).</p>
              <p>Le(s) représentant(s) légal(aux) reconnaît(ssent) avoir pris connaissance du coût de la scolarisation de leur enfant au sein de l&apos;établissement La Providence – Nicolas Barré et s’engage(nt) à en assurer la charge financière, dans les conditions du règlement financier annexé à la présente convention. En cas d’impayés, l’établissement se réserve le droit de recouvrer les sommes dues par tout moyen légal.</p>
            </section>

            <section className="pt-6">
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">5</span> 
                Article 5 – Assurances
              </h3>
              <p>Pour les activités scolaires, l’assurance de la mutuelle St Christophe est proposée à toutes les familles de l’établissement La Providence – Nicolas Barré. Le(s) représentant(s) légal(aux) s’engage(nt), s’ils n’adhèrent pas à cette assurance, à assurer l’enfant pour les activités scolaires, et à produire une attestation d’assurance dans le délai de 15 jours suivant la rentrée scolaire. A défaut de production de l’attestation dans le délai imparti, l’élève sera automatiquement inscrit auprès de la mutuelle St Christophe, le montant correspondant sera alors facturé.</p>
            </section>

            <section className="pt-6">
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">6</span> 
                Article 6 – Dégradation du matériel
              </h3>
              <p>La remise en état ou le remplacement du matériel dégradé par un élève fera l&apos;objet d&apos;une facturation au(x) parent(s) sur la base du coût réel incluant les frais de main-d&apos;œuvre.</p>
            </section>

            <section className="pt-[50px]">
              <h3 className="font-black text-blue-600 uppercase text-[12px] mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">7</span> 
                Article 7 – Durée et résiliation du contrat
              </h3>
              <p className="mb-4">La présente convention est valable pour la durée d’une année scolaire.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10.5px]">
                <div className="space-y-3">
                    <h4 className="font-black text-slate-800 uppercase border-b border-slate-100 pb-1">7-1 Rupture en cours d’année</h4>
                    <p>Les parents peuvent résilier le présent contrat en cours d&apos;année scolaire lors d&apos;un rendez-vous avec le chef d&apos;établissement concerné. Les causes réelles et sérieuses de départ de l&apos;élève en cours d&apos;année sont :</p>
                    <ul className="font-bold text-slate-600 list-disc ml-4">
                        <li>Le déménagement</li>
                        <li>Changement d&apos;orientation</li>
                        <li>Tout autre motif légitime accepté</li>
                    </ul>
                    <p>Le présent contrat ne peut pas être résilié par l&apos;établissement en cours d&apos;année scolaire, sauf en cas de : Sanction disciplinaire, Désaccord avec le projet éducatif ou Perte de confiance.</p>
                    <p className="italic">En tout état de cause, le coût de la scolarisation relatif à la période écoulée reste dû.</p>
                </div>
                <div className="space-y-3">
                    <h4 className="font-black text-slate-800 uppercase border-b border-slate-100 pb-1">7-2 Rupture en fin d’année</h4>
                    <p>Les parents informent l&apos;établissement de la non-ré inscription de leur enfant au plus tard le 15 avril de chaque année.</p>
                    <p>L&apos;établissement peut résilier le présent contrat au terme d&apos;une année scolaire pour : Motif disciplinaire, Désaccord avec le projet éducatif, Perte de confiance, Impayés, Non-respect du présent contrat.</p>
                </div>
              </div>
            </section>

            <section className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-blue-600 uppercase text-[12px] mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">8</span> 
                Article 8 – Droit d&apos;accès aux informations
              </h3>
              <p className="mb-2 italic text-slate-500 font-bold text-center">(annexe 1 de la présente convention)</p>
              <p className="mb-4">Les données qui vous sont demandées dans le formulaire d’inscription sont nécessaires aux fins d’inscription de votre enfant auprès de l’établissement la Providence – Nicolas Barré. Le responsable des traitements est Madame A.M. DONA : coordinatrice du groupe scolaire.</p>
              <p className="text-[10px] leading-tight text-slate-500">La présente information est fournie en application du Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD) et de la loi n°78-17 du 6 janvier 1978 relative à l&apos;informatique, aux fichiers et aux libertés.</p>
            </section>
          </div>
        </div>

        {/* SIGNATURES TRIPLES DIRECTION */}
        <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex justify-between items-end italic text-slate-600 mb-8 text-xs">
                <p>Mesnil-Esnard, le vendredi 13 février 2026</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase mb-4">Signature École</p>
                    <div className="h-20 rounded-xl flex items-center justify-center">
                        <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/Sans+titre.jpg"} width={100} height={100} alt=""/>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase mb-4">Signature Collège</p>
                    <div className="h-20 rounded-xl flex items-center justify-center">
                        <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png"} width={100} height={100} alt=""/>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase mb-4">Signature Lycée</p>
                    <div className="h-20 rounded-xl flex items-center justify-center">
                        <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signature_AMD.png"} width={130} height={130} alt=""/>
                    </div>
                </div>
            </div>
            <p className="text-center mt-6 text-[9px] text-slate-400 italic">Document signé par voie électronique par les responsables légaux</p>
        </div>

        {/* FOOTER BAS DE PAGE */}
        <div className="mt-10 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Convention de scolarisation - La Providence - Rentrée 2026/2027</p>
        </div>

      </div>

      {/* PAGE 2 - ANNEXE INTEGRALE */}
      <div className="bg-white px-12 py-8 mt-12 border border-slate-200 shadow-2xl print:shadow-none print:border-none">
          <h2 className="text-center font-black text-slate-400 uppercase text-lg mb-8 border-b-2 border-slate-100 pb-4">ANNEXE 1 : Traitement des données personnelles</h2>
          
          <div className="text-[10px] leading-relaxed grid grid-cols-2 gap-x-10 gap-y-6 text-justify">
            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">1. Responsable du traitement</h4>
                <p>Le responsable du traitement des données personnelles est l’établissement La Providence – Nicolas Barré, représenté par Mme A.M. DONA, coordinatrice du groupe scolaire. Pour toute question relative aux données personnelles, vous pouvez également contacter le Délégué à la protection des données (DPD) de l’Enseignement catholique à : dpd@enseignement-catholique.fr</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">2. Données collectées</h4>
                <p>Les données personnelles suivantes sont collectées et traitées : Nom, prénom, date et lieu de naissance, sexe de l’élève. Nom, prénom, profession et coordonnées des parents, adresse(s) mail(s), composition de la famille. Données de scolarité : notes, bulletins réguliers, décisions d’orientation… Données nécessaires à la gestion comptable : avis d’imposition, coordonnées bancaires, informations relatives aux bourses… Données relatives à la gestion de la vie scolaire : retards, absences, sanctions… Données liées aux activités pastorales, photos ou vidéos, uniquement avec votre consentement explicite.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">3. Finalités du traitement</h4>
                <p>Ces données sont utilisées pour : La gestion administrative et pédagogique de l’inscription et du suivi scolaire. La gestion financière et comptable. La gestion des activités scolaires et extrascolaires (listes de classes, groupes, sorties, voyages…). L’utilisation d’outils numériques et progiciels éducatifs (EcoleDirecte, Charlemagne, intranet, tablettes, Microsoft 365 Education). Le suivi spécifique des élèves (PAI, PAP, notifications MDPH…). L’inscription aux procédures d’orientation et examens. La communication avec les familles et le respect des obligations légales. Ces traitements sont nécessaires à l’exécution du contrat de scolarisation.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">4. Sous-traitants et outils numériques</h4>
                <p>Certaines données sont traitées par des sous-traitants : EcoleDirecte (Aplim) : gestion scolaire et suivi pédagogique. Charlemagne (Aplim) : suivi administratif et pédagogique. Microsoft 365 Education (OneDrive, Teams, Outlook) : stockage et partage sécurisé. Ces prestataires agissent pour le compte de l’établissement et ne peuvent utiliser les données à d’autres fins.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">5. Intelligence artificielle</h4>
                <p>Certainis outils numériques (EcoleDirecte, Microsoft 365 Education) intègrent des fonctionnalités d’IA pour : Aider à la saisie ou au classement automatique de données, Fournir des statistiques ou alertes pédagogiques. Aucune décision automatisée produisant des effets juridiques ou significatifs sur l’élève n’est prise.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">6. Transmission aux autorités</h4>
                <p>Certaines données sont transmises : Rectorat de l’Académie de Normandie et DSDEN : suivi de la scolarité, orientation, examens, statistiques (base légale : obligation légale). APEL, Association Gabriel, UGSEL : gestion associative et sportive, statistiques. Mairie et collectivités territoriales : conformément à l’article L131-6 du Code de l’éducation.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">7. Destinataires des données</h4>
                <p>Professeurs et intervenants pédagogiques : suivi scolaire et pédagogique. Mutuelle Saint Christophe : assurance scolaire. Sous-traitants numériques : uniquement pour les finalités définies. Rectorat et organismes cités ci-dessus.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">8. Localisation et sécurité</h4>
                <p>EcoleDirecte et Charlemagne : hébergés dans l’Union européenne. Microsoft 365 Education : principalement UE, transferts hors UE protégés par clauses contractuelles types. Mesures de sécurité : accès restreints, mots de passe, sauvegardes régulières, chiffrement des données sensibles.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">9. Durée de conservation</h4>
                <p>Toutes les données sont conservées pendant la durée de la scolarité et 10 ans après la fin de la scolarité, sauf obligation légale contraire.</p>
            </section>

            <section>
                <h4 className="font-black uppercase text-blue-600 mb-1 italic">10. Droits des parents</h4>
                <p>Vous disposez des droits suivants conformément au RGPD : Accès, rectification, effacement, limitation, opposition, portabilité. Retrait de consentement pour les données sensibles (pastorale, photos, vidéos, santé). Pour exercer vos droits : Contactez le DPD : dpd@enseignement-catholique.fr ou le responsable de traitement : 0761713z@ac-normandie.fr La Providence – Nicolas Barré, 6 rue de Neuvillette, 76240 Le Mesnil-Esnard. Réclamation possible auprès de la CNIL.</p>
            </section>
          </div>

          {/* SIGNATURES TRIPLES ANNEXE */}
          <div className="mt-4 pt-4 border-t border-slate-100 italic text-slate-500 text-[10px] text-right mb-4">
              Mesnil-Esnard, le vendredi 13 février 2026
          </div>
          <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                  <p className="text-[10px] font-black uppercase mb-2">Signature École</p>
                  <div className="h-20 rounded-xl flex items-center justify-center">
                      <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/Sans+titre.jpg"} width={100} height={100} alt=""/>
                  </div>
              </div>
              <div className="text-center">
                  <p className="text-[10px] font-black uppercase mb-2">Signature Collège</p>
                  <div className="h-20 rounded-xl flex items-center justify-center">
                      <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png"} width={100} height={100} alt=""/>
                  </div>
              </div>
              <div className="text-center">
                  <p className="text-[10px] font-black uppercase mb-2">Signature Lycée</p>
                  <div className="h-20 border border-slate-50 rounded-xl flex items-center justify-center text-[8px] text-slate-300 italic">
                      <Image src={"https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signature_AMD.png"} width={130} height={130} alt=""/>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}