"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  DASHBOARD_ENTER_CTA,
  DASHBOARD_ROW_PULSE,
  DASHBOARD_ROW_SHELL,
} from "@/app/lib/dashboard-theme";

type Props = {
  name: string;
  img: string;
  link: string;
  priority?: boolean;
  pulse?: boolean;
  external?: boolean;
  tall?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
};

function TitleLink({
  name,
  link,
  external,
}: {
  name: string;
  link: string;
  external?: boolean;
}) {
  const className =
    "text-base font-black text-[#14231A] transition hover:text-[var(--dash-primary)] sm:text-lg";
  if (external) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={className}>
        {name}
      </a>
    );
  }
  return (
    <Link href={link} className={className}>
      {name}
    </Link>
  );
}

export default function TileShell({
  name,
  img,
  link,
  priority,
  pulse,
  external,
  tall,
  children,
  footer,
}: Props) {
  const isPriorityImage = priority || img.includes("reservationsalle.jpg");

  return (
    <div
      className={`${DASHBOARD_ROW_SHELL} ${pulse ? DASHBOARD_ROW_PULSE : ""} ${
        tall ? "min-h-[10rem] flex-col sm:flex-row" : "flex-row"
      }`}
    >
      {external ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative shrink-0 overflow-hidden bg-[color:var(--dash-soft)]/50 ${
            tall ? "h-28 w-full sm:h-auto sm:w-28" : "w-24 sm:w-28"
          }`}
        >
          {img ? (
            <Image
              src={img}
              alt=""
              fill
              sizes="112px"
              priority={isPriorityImage}
              fetchPriority={isPriorityImage ? "high" : "auto"}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[6.5rem] items-center justify-center text-2xl font-black text-[var(--dash-primary)]">
              {name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </a>
      ) : (
        <Link
          href={link}
          className={`relative shrink-0 overflow-hidden bg-[color:var(--dash-soft)]/50 ${
            tall ? "h-28 w-full sm:h-auto sm:w-28" : "w-24 sm:w-28"
          }`}
        >
          {img ? (
            <Image
              src={img}
              alt=""
              fill
              sizes="112px"
              priority={isPriorityImage}
              fetchPriority={isPriorityImage ? "high" : "auto"}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[6.5rem] items-center justify-center text-2xl font-black text-[var(--dash-primary)]">
              {name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
        <TitleLink name={name} link={link} external={external} />
        {children}
      </div>

      <div className="flex shrink-0 flex-col items-stretch justify-center gap-2 p-3 sm:items-end sm:pl-0">
        {footer}
        {!footer ? (
          <Link
            href={link}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={DASHBOARD_ENTER_CTA}
          >
            Ouvrir
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
