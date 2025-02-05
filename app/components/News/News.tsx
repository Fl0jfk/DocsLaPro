"use client"

import { useData } from "@/app/contexts/data";

export default function News() {
  const { news } = useData();
  type NewsItem = { id: number; jour: string; date: string; actus: Actualite[];};
  type Actualite = { id: number; text: string;}  
  return (
    <section className="p-4 flex flex-col gap-4 max-w-[1000px] mx-auto">
      <h2 className="text-4xl font-semibold">Actualités de la semaine</h2>
      <div className="rounded-lg border border-gray-200">
        <table className="w-full rounded-t-xl">
          <thead className="bg-gray-100 rounded-t-xl">
            <tr>
              <th className="p-2 text-gray-700 border-r border-white">Jour</th>
              <th className="p-2 text-gray-700">Actualités</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {news.map((item: NewsItem) => (
              <tr key={item.id}>
                <td className="p-2 border-r border-grey-100 flex flex-col items-center">
                  <p className=" text-4xl font-semibold">{item.jour}</p>
                  <p>{item.date}</p>
                </td>
                <td>{item.actus.map((actu, index) => (
                  <p className={`p-2 ${index !== item.actus.length - 1 ? 'border-b' : ''}`} key={actu.id}>- {actu.text}</p>
                ))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
