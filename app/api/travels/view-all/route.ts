import { NextResponse } from "next/server";
import { readVoyages } from "@/app/utils/voyageStore";

export async function GET() {
  const voyages = await readVoyages();
  return NextResponse.json(voyages);
}
