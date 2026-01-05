import Image from "next/image";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";

export default function CarteRéseau() {
  return (
    <main className="relative w-screen h-screen flex flex-col overflow-hidden bg-[rgba(207, 207, 216, 1)] p-4">
      <section className="flex w-full justify-between">
        <Image src={Logo} alt="" className="w-[10%]"/>
        <div className="flex flex-col">
          <div className="flex flex-col items-center">
            <p>Etablissements scolaires partenaires</p>
            <div className="flex gap-4">
              <div className="flex flex-col border">
                <p>Etablissements publics territoriaux</p>
                <div>
                  <p>Lycée Galilée</p>
                  <p>Collèges Hector Malot, Emile Verhaeren, Masséot Abaquesne</p>
                  <p>Ecoles Edouard Herriot, Louis Lemonnier</p>
                </div>
              </div>
              <div className="flex flex-col border">
                <p>Etablissements privés du plateau</p>
                <div>
                  <p>Campus professionnel et technologique La Chataigneraie</p>
                  <p>Ecole ND de Nazareth</p>
                </div>
              </div>
              <div className="flex flex-col border">
                <p>Etablissements scolaires étrangers</p>
                <div>
                  <p>Westford Academy (US)</p>
                  <p>Ecole Mahaboboka (Madagascar)</p>
                  <p>Gymasium Harksheide (Allemagne)</p>
                </div>
              </div>
              <div className="flex flex-col border">
                <p>Etablissements régionaux sous tutelle Nicolas Barré</p>
                <div>
                  <p>Lycée Rey (Bois Guillaume)</p>
                  <p>Collège Sainte Marie (Rouen)</p>
                  <p>Ecole-collège St Hildevert (Gournay en Bray)</p>
                  <p>Ecole ND, collège St Louis (Louviers)</p>
                  <p>Ecole Ste Marie (Doudeville)</p>
                  <p>Ecole Jeanne d Arc (Aumale)</p>
                  <p>Ecole-collège Providence-Nazareth (Eu)</p>
                </div>
              </div>   
            </div>
          </div>
        </div>
      </section>
      <section>
        2
      </section>
      <section>
        3
      </section>
    </main>
  );
}

