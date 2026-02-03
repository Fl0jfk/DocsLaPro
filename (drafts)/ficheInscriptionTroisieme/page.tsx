import Image from "next/image"
import logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"

export default function Page(){
    return (
        <main className="w-screen max-w-[1000px] flex flex-col mx-auto gap-1 text-sm">
            <div className="bg-blue-400 flex gap-14 p-2 rounded-xl">
                <div>
                    <Image src={logo} alt="logo" width={100} height={100}/>
                </div>
                <div className="flex flex-col text-white uppercase text-[23px] justify-center text-center gap-2">
                    <h1>Collège LA PROVIDENCE - NICOLAS BARRE</h1>
                    <h2>Année 2026 - 2027</h2>
                </div>
            </div>
            <div className="bg-blue-400  rounded-xl flex flex-col text-white uppercase text-[18px] justify-center text-center p-4">
                <p>Demande d&apos;inscription en troisième</p>
            </div>
            <section className="border-2 border-blue-400 rounded-xl p-2 px-4 flex flex-col justify-center gap-1">
                <h3 className="text-center underline font-bold text-xl">Elève</h3>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Nom :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Prénoms :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Date de naissance :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Lieu :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Département :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Nationalité :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[68%]">
                        <p>Etablissement précédent :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[32%]">
                        <p>Classe :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Adresse :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[50%]">
                        <p>Code Postal et ville :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
            </section>
            <section className="border-2 border-blue-400 rounded-xl p-2 px-4 flex flex-col justify-center gap-2">
                <h3 className="text-center underline font-bold text-xl">Régime</h3>
                <div className="flex justify-between mx-20">
                    <div className="flex gap-4">
                        <input type="checkbox"></input>
                        <p>Internat</p>
                    </div>
                    <div className="flex gap-4">
                        <input type="checkbox"></input>
                        <p>Demi-pension</p>
                    </div>
                    <div className="flex gap-4">
                        <input type="checkbox"></input>
                        <p>Externat</p>
                    </div>
                </div>
            </section>
            <section>
                <div className="border-2 border-blue-400 w-full rounded-xl flex flex-col">
                    <div className="w-full bg-blue-400 flex text-center items-center justify-center rounded-t-lg">     
                        <p className="px-4 py-2 border-r font-bold uppercase w-[55%] text-center">Souhait concernant la classe de 3ème</p>
                        <p className=" px-4 py-2 font-bold uppercase w-[45%] text-center">Enseignements optionnels</p>
                    </div>
                <div className="w-full flex">
                    <div className="w-[55%] border-r border-blue-400">
                    <div className="align-top text-center">
                        <ul className="list-inside">
                            <div className="flex gap-4 items-center justify-center p-2">
                                <input type="checkbox"></input>
                                <li>Entrée en 3ème Anglais LV1 + Espagnol LV2</li>
                            </div>
                        <hr className="border-blue-400" />
                        <div className="flex gap-4 items-center justify-center p-2">
                                <input type="checkbox"></input>
                                <li>Entrée en 3ème Anglais LV1 + Allemand LV2</li>
                        </div>
                        <hr className="border-blue-400" />
                        <div className="flex gap-4 items-center justify-center p-2">
                                <input type="checkbox"></input>
                                <li>Entrée en 3ème Bilangue (Anglais + Allemand LV1)</li>
                            </div>
                        </ul>
                    </div>
                    </div>
                    <div className="w-[45%] h-full">
                        <div className="align-top text-center h-full">
                            <ul className="list-inside">
                            <ul className="list-square">
                                <div className="flex justify-between w-[95%] mx-auto p-2">
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>Chorale</li>
                                    </div>
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>Latin</li>
                                    </div>
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>Grec</li>
                                    </div>
                                </div>
                            </ul>
                            <hr className="border-blue-400" />
                            <ul className="list-square h-full">
                                <div className="flex items-center justify-between w-[95%] h-full m-auto p-2">
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>USMEF Foot</li>
                                    </div>
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>BMFB Basket</li>
                                    </div>
                                    <div className="flex gap-2 items-center justify-center">
                                        <input type="checkbox"></input>
                                        <li>ALISA Equitation</li>
                                    </div>
                                </div>
                            </ul>   
                            <hr className="border-blue-400" /> 
                            <ul className="list-square h-full">
                                <div className="flex items-center justify-between w-[95%] h-full m-auto p-2">
                                    <div className="w-full flex gap-2 items-center justify-center mx-auto">
                                        <input type="checkbox"></input>
                                        <li>Option découverte professionnelle</li>
                                    </div>
                                </div>
                            </ul>                      
                            </ul>
                        </div>
                    </div>
                </div>
                </div>
            </section>
            <section className="border-2 border-blue-400 rounded-xl p-2 px-4 flex flex-col justify-center gap-[2px]">
                <h3 className="text-center underline font-bold text-xl leading-5">Autres informations</h3>
                <div className="flex gap-6">
                    <p>Avez-vous un enfant dans un autre établissement privé :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Non</p>
                    </div>
                    <div className="flex gap-2 no-wrap w-[20%]">
                        <input type="checkbox"></input>
                        <p>Oui - Nombre :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <p>Avez-vous déjà un enfant à La Providence - Le-Mesnil-Esnard :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Non</p>
                    </div>
                    <div className="flex gap-2 no-wrap w-[20%]">
                        <input type="checkbox"></input>
                        <p>Oui - Nombre :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex flex-col">
        <p>Composition de la famille - Frère(s) et Soeur(s)</p>
        <table className="table-auto w-full border-collapse border border-blue-400">
            <thead>
                <tr className="bg-blue-400">
                    <th className="border border-blue-400 border-r-white px-4 py-2">Nom et Prénom</th>
                    <th className="border border-blue-400 border-r-white px-4 py-2">Date de Naissance</th>
                    <th className="border border-blue-400 px-4 py-2 border-r-white">Classe</th>
                    <th className="border border-blue-400 px-4 py-2">Établissement</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                </tr>
                <tr>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                </tr>
                <tr>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                </tr>
                <tr>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                    <td className="border border-blue-400 px-4 py-4"></td>
                </tr>
            </tbody>
        </table>
    </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Moyen(s) de transport utilisé(s) :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Observations particulières (santé, caractère, aptitudes, besoins particuliers, handicap ...) :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2 mt-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2 mt-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2 mt-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                
            </section>
            <section className="border-2 border-blue-400 rounded-xl p-2 px-4 flex flex-col justify-center gap-2 mt-2">
                <h3 className="text-center underline font-bold text-xl leading-5">Responsable principal</h3>
                <div className="flex gap-16">
                    <p>Civilité :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Madame</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Monsieur</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Nom :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Nom de jeune fille:</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Prénom :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-10">
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>marié(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>veuf ou veuve</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>séparé(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>divorcé(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autre</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Lien de parenté avec l&apos;élève</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-16">
                    <p>Responsabilité :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autorité parentale</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>tuteur ou tutrice</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Adresse :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[30%]">
                        <p>Code postal :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[70%]">
                        <p>Ville :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[40%]">
                        <p>Tél. Domicile :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[60%]">
                        <p>E-mail :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>en activité</p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[40%]">
                        <p>Profession :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>recherche d&apos;emploi</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>retraité</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autre</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Employeur :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Tél portable :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Tél professionnel :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
            </section>
            <section className="border-2 border-blue-400 rounded-xl p-2 px-4 flex flex-col justify-center gap-2">
                <h3 className="text-center underline font-bold text-xl leading-5">Conjoint ou autre responsable</h3>
                <div className="flex gap-16">
                    <p>Civilité :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Madame</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>Monsieur</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Nom :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Nom de jeune fille:</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Prénom :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-10">
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>marié(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>veuf ou veuve</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>séparé(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>divorcé(e)</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autre</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Lien de parenté avec l&apos;élève</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-16">
                    <p>Responsabilité :</p>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autorité parentale</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>tuteur ou tutrice</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[100%]">
                        <p>Adresse</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[30%]">
                        <p>Code postal :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[70%]">
                        <p>Ville :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[40%]">
                        <p>Tél. Domicile :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[60%]">
                        <p>E-mail :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>en activité</p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[40%]">
                        <p>Profession :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>recherche d&apos;emploi</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>retraité</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <p>autre</p>
                    </div>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Employeur :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Tél portable :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                    <div className="flex no-wrap justify-center gap-4 w-[33%]">
                        <p>Tél professionnel :</p>
                        <p className="border-b-[1px] border-black flex-grow"></p>
                    </div>
                </div>
            </section>
            <section>
                <div className="flex no-wrap justify-center  w-[100%] gap-2">
                    <p>Je soussigné(e) : </p>
                    <p className="border-b-[1px] border-black flex-grow"></p>
                    <p>déclare accepter pour mon enfant le but de l&apos;Ecole Catholique.</p> 
                </div>
                <div className="flex no-wrap justify-center gap-4 w-[100%]">
                    <p>Celle-ci s&apos;efforce &quot; de lier dans le même temps et le même acte l&apos;acquisition du savoir, la formation à l&apos;autonomie et à la prise de responsabilités et l&apos;éducation de la Foi. &quot;</p>
                </div>
                <div className="flex no-wrap justify-center gap-4 w-[80%] mt-4 mx-auto">
                    <p>A :</p>
                    <p className="border-b-[1px] border-black flex-grow"></p>
                    <p>le :</p>
                    <p className="border-b-[1px] border-black flex-grow"></p>
                </div>
                <div className="flex no-wrap justify-center gap-2 w-[100%] mt-4">
                    <p>Signature du ou des responsables</p>
                    <p>(Faire précéder la signature de la mention &quot;LU et APPROUVE&quot;)</p>
                </div>
            </section>
        </main>
    )
}