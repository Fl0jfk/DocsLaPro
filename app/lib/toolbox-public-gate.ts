import "server-only";

import { notFound } from "next/navigation";
import { getToolboxConfig, getToolboxConfigResolved } from "@/app/lib/toolbox-config";
import type {
  PortesOuvertesToolConfig,
  RentreeToolConfig,
  SimulateurTarifsConfig,
} from "@/app/lib/toolbox-types";

/** Page /rentree — 404 si l'outil n'est pas activé dans la boîte à outils. */
export async function requireRentreePublicPage(): Promise<RentreeToolConfig> {
  const config = await getToolboxConfigResolved();
  if (!config.tools.rentree.enabled) notFound();
  return config.tools.rentree;
}

/** Page /simulateurTarifs — 404 si désactivé. */
export async function requireSimulateurTarifsPublicPage(): Promise<SimulateurTarifsConfig> {
  const config = await getToolboxConfig();
  if (!config.tools["simulateur-tarifs"].enabled) notFound();
  return config.tools["simulateur-tarifs"];
}

/** Page /simulateurFournitures — 404 si désactivé. */
export async function requireSimulateurFournituresPublicPage(): Promise<void> {
  const config = await getToolboxConfig();
  if (!config.tools["simulateur-fournitures"].enabled) notFound();
}

/** Page /portes-ouvertes — 404 si désactivé. */
export async function requirePortesOuvertesPublicPage(): Promise<PortesOuvertesToolConfig> {
  const config = await getToolboxConfig();
  const po = config.tools["portes-ouvertes"];
  if (!po.enabled) notFound();
  return po;
}
