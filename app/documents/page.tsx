"use client"

import Link from "next/link";
import { useData } from "../contexts/data";

export default function Home() {
  const { documents } = useData();
  return (
    <main className="flex flex-col gap-6 p-6 w-full mx-auto max-w-[1000px] md:pt-[13vh] sm:pt-[13vh]">
      <section className="space-y-4">
        {documents.map((categoryData, index) => (
          <details key={index} className="group bg-white rounded-lg shadow-md">
            <summary className="cursor-pointer select-none py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg transition-all duration-300 group-open:rounded-b-none">
              {categoryData.category}
            </summary>
            <ul className="pl-6 py-2 space-y-2 bg-gray-50 rounded-b-lg">
              {categoryData.documents.map((doc, docIndex) => (
                <li key={docIndex} className="flex gap-4">
                  <p>{doc.title} :</p>
                  {doc.printable && (
                    <Link className="text-blue-500 hover:underline" href={doc.printable}>Version à imprimer</Link>
                  )}
                  {doc.digital && (
                    <Link className="text-blue-500 hover:underline" href={doc.digital}>Version numérique</Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </main>
  );
}

