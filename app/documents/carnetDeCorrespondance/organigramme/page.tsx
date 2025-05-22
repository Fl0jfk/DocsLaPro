"use client";
import { UserCircle, School, FileText, HeartPulse, Users, BookOpen, AlertCircle, VenusAndMars, Star, PersonStanding, CreditCard, GraduationCap, Library, Ear, HandHeart, User, HeartPlus, TicketPlus} from "lucide-react";

export default function Organigramme() {
  return (
    <main className="relative w-full flex flex-col gap-3 items-center justify-center p-2 max-w-[800px] mx-auto bg-white text-black">
        <h1 className="font-bold text-3xl underline">A qui s&apos;adresser ?</h1>
      <Section title="Direction" icon={<School className="text-blue-600" />}>
        <Person title="Directrice" name="Madame DUMOUCHEL" icon={<UserCircle />} tasks={["Problème grave personnel ou scolaire"]} contact="0762565a@ac-normandie.fr"/>
        <Person title="Secrétariat" name="Madame VILLIER" icon={<FileText />} tasks={["Inscriptions", "Questions administratives", "RDV 1er PAP"]} contact="sarah.buno@ac-normandie.fr"/>
      </Section>
      <Section title="Vie scolaire" icon={<Users className="text-green-600" />}>
        <Person title="Cadres éducatifs" name="Mme CORIOU (6e, 5e) / M. LAQUIEVRE (4e, 3e)" icon={<Users />} tasks={["Organisation de la vie quotidienne", "Mal-être et RDV Psychologue", "Suivi de la scolarité, emploi du temps"]}/>
        <Person title="Assistants d'éducation" name="Madame Vieira Da Rosa" icon={<PersonStanding />} tasks={["Billets d'absences, autorisations de sorties", "Surveillance de la cour", "Étude", "Gestion des téléphones portables"]} />
      </Section>
      <Section title="Accueil - Comptabilité - Réinscriptions" icon={<FileText className="text-yellow-600" />}>
        <Person title="Accueil" name="Madame Perrier" icon={<UserCircle />} tasks={["Déclaration d'accidents", "Dossier bourse"]} contact="02-32-86-50-90"/>
        <Person title="Comptabilité" name="Mme Boutigny / Mme Douaglin" icon={<CreditCard />} tasks={["Voyages", "Factures"]}/>
        <Person title="Réinscription" name="Monsieur Hacqueville-Mathi" icon={<TicketPlus />} tasks={["Réinscriptions", "Grilles tarifaires"]}/>
      </Section>
      <Section title="Pôle Médico-Social" icon={<HeartPulse className="text-pink-600" />}>
        <Person title="Infirmerie" icon={<HeartPulse />} tasks={["Problèmes de santé", "Mal-être", "Mise en place des PAI"]} />
        <Person title="Psychologue scolaire" icon={<Ear />} tasks={["Projet et démarches d'orientation", "Bilans", "Mal-être"]} contact="RDV via cadres éducatifs"/>
      </Section>
      <Section title="Équipe pédagogique" icon={<GraduationCap className="text-purple-600" />}>
        <Person title="Professeur principal" icon={<UserCircle />} tasks={["Suivi scolarité et orientation", "Renouvellement PAP", "Animation pédagogique"]}/>
        <Person title="Professeurs" icon={<BookOpen />} tasks={["Enseignement", "Disciplinaire", "Suivi de scolarité"]} />
        <Person title="Professeur documentaliste" icon={<Library />} tasks={["Recherches documentaires", "Médias", "Lecture"]} />
      </Section>
      <Section title="Autres" icon={<Star className="text-gray-500" />}>
        <Person title="Discrimination harcèlement" name="Madame Galien"  icon={<AlertCircle />} />
        <Person title="Santé bien-être" name="Monsieur GROUT" icon={<HeartPlus />} />
        <Person title="EVARS" name="Madame ISRAEL" icon={<VenusAndMars />} />
        <Person title="Référent EBP" name="Madame Guédin" icon={<User/>} />
        <Person title="Animation pastorale" name="Mme Duboc Mme Masset" icon={<HandHeart />} />
      </Section>
    </main>
  );
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="w-full p-2 rounded-xl bg-gray-100">
      <h2 className="font-semibold flex items-center gap-4 mb-1 text-xl">{icon} {title}</h2>
      <div className="flex w-full gap-2">{children}</div>
    </div>
  );
}

function Person({ title, name, icon, contact, tasks}:{ title: string; name?: string; icon: React.ReactNode; tasks?: string[]; contact?:string}) {
  return (
    <div className="bg-white border rounded-lg p-2 w-full">
        <div className="flex items-center flex-wrap">
            <h3 className="font-medium flex items-center gap-2 text-[16px]">{icon} {title}</h3>
            {name && <h4 className="ml-6 text-[15px] font-light text-gray-600">{name}</h4>}
            {contact&& <h4 className="ml-6 text-[13px] font-light text-gray-600">{contact}</h4>}

        </div> 
      {tasks && (
        <ul className="ml-6 list-disc text-sm mt-1">
          {tasks.map((task, i) => (
            <li key={i}>{task}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
