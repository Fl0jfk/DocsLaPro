import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4 w-full max-w-[1000px] mx-auto">
      <Link href={"/documents"}>Les documents</Link>
      <Link href={"/tutos"}>Les tutoriels</Link>
    </main>
  );
}
