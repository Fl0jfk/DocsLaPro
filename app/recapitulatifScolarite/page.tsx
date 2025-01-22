export default function Home() {
  return (
    <main className="p-4 flex flex-col gap-4 z-screen">
      <p className="text-center text-xl">
        En cas de séparation, désirez-vous que les bulletins trimestriels, circulaires, soient adressés à une autre personne ?
      </p>
      <div className="flex justify-between w-[50%] self-center">
        <div className="flex gap-4">
          <input type="checkbox"></input>
          <p>OUI</p>
        </div>
        <div className="flex gap-4">
          <input type="checkbox"></input>
          <p>NON</p>
        </div>
      </div>
      <p className="mb-2 underline text-center text-xl">Si oui, nous indiquer son état civil :</p>
      <div className="flex gap-4 mb-2">
        <div className="flex no-wrap justify-center gap-4 w-[60%]">
          <p>Nom :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
        <div className="flex no-wrap justify-center gap-4 w-[40%]">
          <p>Prénom :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <div className="flex flex-nowrap justify-center gap-4 w-[100%]">
          <p>Adresse :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <div className="flex justify-center gap-4 w-[60%] flex-nowrap">
          <p>Code postal :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
        <div className="flex  justify-center gap-4 w-[40%]">
          <p>Ville :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <div className="flex justify-center gap-4 w-[100%] flex-nowrap">
          <p>N° de téléphone :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
      </div>
      <div className="mb-2 border-4 border-black p-4">
        <div className="flex gap-8">
          <p> - Souhaitez-vous faire du covoiturage :</p>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <input type="checkbox"></input>
              <p>Oui</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox"></input>
              <p>Non</p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-nowrap gap-8">
          <p className="w-[65%]">
            - Autorisez-vous l&apos;établissement à diffuser un listing (Nom-Prénom des parents, Nom-Prénom-Classe de l&apos;élève,
            commune, n°Tél domicile) aux autres familles intéressées :
          </p>
          <div className="flex gap-8 flex-grow">
            <div className="flex items-center gap-2">
              <input type="checkbox"></input>
              <p>Oui</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox"></input>
              <p>Non</p>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center underline uppercase">Récapitulatif de la scolarité de votre enfant :</h1>

      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 py-2">Année Scolaire</th>
              <th className="border border-gray-300 py-2">Classe de</th>
              <th className="border border-gray-300 py-2">Nom de l&apos;Établissement</th>
              <th className="border border-gray-300 px-14 py-2">Ville</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {[
              "2019-2020",
              "2020-2021",
              "2021-2022",
              "2022-2023",
              "2023-2024",
              "2024-2025",
            ].map((year, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-4 py-2">{year}</td>
                <td className="border border-gray-300 px-4 py-2"></td>
                <td className="border border-gray-300 px-4 py-2"></td>
                <td className="border border-gray-300 px-4 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col w-full gap-4 border-4 border-black p-4">
        <p>IMPORTANT : Afin de permettre la diffusion de documents internes à l&apos;établissement (circulaires, courriers...) nous vous demandons une adresse mail valide qui restera confidentielle.</p>
        <div className="flex justify-center gap-4 w-[100%] flex-nowrap">
          <p>E-mail :</p>
          <p className="border-b-[1px] border-black flex-grow"></p>
        </div>
      </div>
    </main>
  );
}
