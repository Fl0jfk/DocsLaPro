import Image from "next/image";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  src?: string;
  label: string;
};

export default function DashboardModuleIcon({ src, label }: Props) {
  if (!src) {
    return (
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${dash.bgSoft}`}
        aria-hidden
      >
        📋
      </span>
    );
  }

  return (
    <span className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm ${dash.border}`}>
      <Image src={src} alt="" fill className="object-cover" sizes="28px" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
