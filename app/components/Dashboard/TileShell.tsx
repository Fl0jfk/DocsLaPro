"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  name: string;
  img: string;
  link: string;
  priority?: boolean;
  pulse?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
};

export default function TileShell({ name, img, link, priority, pulse, children, footer }: Props) {
  const isPriorityImage = priority || img.includes("reservationsalle.jpg");
  return (
    <div
      className={`bg-white border shadow-xs hover:shadow-lg border-gray-200 flex flex-col h-[350px] md:max-lg:h-[300px] sm:max-md:h-[450px] min-w-[250px] rounded-3xl m-3 relative overflow-hidden transition-transform duration-300 ease-in-out xl:hover:scale-[1.02] ${
        pulse ? "ring-2 ring-amber-400 ring-offset-2 animate-pulse" : ""
      }`}
    >
      <Link href={link} className="absolute inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1] pointer-events-none" />
        {img && (
          <Image
            src={img}
            fill
            alt={name}
            sizes="35vw"
            priority={isPriorityImage}
            fetchPriority={isPriorityImage ? "high" : "auto"}
            className="rounded-3xl object-contain pointer-events-none"
          />
        )}
      </Link>
      <div className="relative z-[2] mt-auto p-4 flex flex-col gap-2 pointer-events-none">
        <p className="sm:max-md:text-3xl text-2xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
          {name}
        </p>
        {children}
      </div>
      {footer && <div className="relative z-[3] px-4 pb-4 pointer-events-auto">{footer}</div>}
    </div>
  );
}
