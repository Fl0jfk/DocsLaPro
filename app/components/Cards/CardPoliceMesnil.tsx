import Image from "next/image"

export default function Card (){
    const logoPolice = "https://docslapro.s3.eu-west-3.amazonaws.com/documents/cartePoliceMesnil/Logo_Police_Municipale_(France).svg.png"
    const logoMesnil = "https://docslapro.s3.eu-west-3.amazonaws.com/documents/cartePoliceMesnil/Mesnil-Esnard-Logo-Footer.jpg"
    return (
        <section className="flex flex-col gap-2 text-blue-900 py-3 w-full border">
            <div className="flex items-center justify-between w-4/5">
                <Image src={logoMesnil} alt="logo mesnil" width={90} height={90}/>
                <p className="font-bold text-nowrap text-md">Police Municipale</p>
            </div>
            <div className="flex justify-end w-[68%]">
                <Image className="mt-[-20px]" src={logoPolice} alt="logo police" width={60} height={60}/>
            </div>
            <div className="border-b-8 border-blue-900 w-[90%]"></div>
            <div className="flex mt-[-7px] gap-2 px-1">
                <div className="flex flex-col text-[10px]">
                    <p>97, route de Paris</p>
                    <p>76240 LE MESNIL-ESNARD</p>
                    <div className="flex gap-1">
                        <p className="text-[7px]">Mairie : 02 32 86 56 56</p>
                        <p className="text-[7px]">www.le-mesnil-esnard.fr</p>
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="font-bold text-[14px]">Tél : 02 35 80 55 60</p>
                    <p className="text-[10px]">police.municipale@le-mesnil-esnard.fr</p>
                </div>
            </div>
        </section>
    )
}