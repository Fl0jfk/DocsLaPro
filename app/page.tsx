import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4 w-full">
      <Link href={"/documents"}>Les documents</Link>
    </main>
  );
}
