import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partenaires sportifs",
  description:
    "Football (FCR, USMEF), basket (BMFB), tennis (ETPE), équitation (ALISA), aviron (CN Belbeuf), karaté-do : partenariats sport-études La Providence Nicolas Barré, Le Mesnil-Esnard.",
};

export default function PartenairesSportifsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
