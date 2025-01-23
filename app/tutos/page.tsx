import Link from "next/link"

export default function Page (){
    return (
        <main className="p-4 text-xl flex flex-col gap-6 items-center justify-center mt-12">
            <Link href={"/tutos/repasDesProfs"}>Le repas de professeurs</Link>
            <Link href={"/tutos/transportsVoyages"}>Le transport des voyages</Link>
        </main>
    )
}