import type { ModuleTourExcelColumn } from "@/app/lib/module-tours";

type Props = {
  columns: ModuleTourExcelColumn[];
};

export default function ModuleTourExcelPreview({ columns }: Props) {
  const rowCount = Math.max(...columns.map((c) => c.sampleValues.length), 0);

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-inner">
      <table className="min-w-full border-collapse text-[10px] leading-tight">
        <thead>
          <tr className="bg-slate-100">
            <th className="sticky left-0 z-10 w-7 border border-slate-300 bg-slate-200 px-1 py-1 text-center font-semibold text-slate-500" />
            {columns.map((col) => (
              <th
                key={col.letter}
                className="min-w-[4.5rem] border border-slate-300 px-1.5 py-1 text-center font-bold text-slate-600"
              >
                {col.letter}
              </th>
            ))}
          </tr>
          <tr className="bg-emerald-700 text-white">
            <th className="sticky left-0 z-10 border border-slate-300 bg-slate-200 px-1 py-1 text-center font-semibold text-slate-600">
              1
            </th>
            {columns.map((col) => (
              <th
                key={`h-${col.letter}`}
                className="border border-emerald-800 px-2 py-1.5 text-left font-bold whitespace-nowrap"
              >
                {col.header}
                {col.optional && (
                  <span className="ml-1 font-normal text-emerald-200">(opt.)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-1 py-1 text-center font-semibold text-slate-500">
                {rowIdx + 2}
              </td>
              {columns.map((col) => (
                <td
                  key={`${col.letter}-${rowIdx}`}
                  className="border border-slate-300 px-2 py-1 text-slate-700 whitespace-nowrap"
                >
                  {col.sampleValues[rowIdx] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
