"use client"

import { useData } from "@/app/contexts/data";

export default function News() {
  const { news } = useData();
  type NewsItem = { id: number; jour: string; date: string; actus: Actualite[];};
  type Actualite = { id: number; text: string;}  
  return (
    <section className="p-4 flex flex-col gap-4 max-w-[1000px] mx-auto">
      <h2 className="text-4xl font-semibold">Actualités de la semaine</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700 border-r border-white">Jour</th>
              <th className="px-4 py-2 text-left text-gray-700 border-r border-white">Date</th>
              <th className="px-4 py-2 text-left text-gray-700">Actualités</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {news.map((item: NewsItem) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 border-r border-grey-100 text-4xl font-semibold">{item.jour}</td>
                  <td className="px-4 py-2 border-r border-grey-100">{item.date}</td>
                  <td className="px-4 py-2 ">{item.actus.map((actu) => (
                    <p className="border-b p-4" key={actu.id}>- {actu.text}</p>
                  ))}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
