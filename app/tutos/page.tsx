import Link from "next/link"

export default function Page (){
    return (
        <main className="w-full max-w-[1000px] mx-auto p-4 text-xl flex flex-col gap-6 items-center justify-center md:pt-[10vh] sm:pt-[10vh]">
            <Link href={"/tutos/repasDesProfs"}>Le repas de professeurs</Link>
            <Link href={"/tutos/transportsVoyages"}>Le transport des voyages</Link>
        </main>
    )
}