import { NextRequest, NextResponse } from "next/server";
import { readVoyages } from "@/app/utils/voyageStore";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const voyages = await readVoyages();
  const mine = voyages.filter(v => v.email === email);
  return NextResponse.json(mine);
}
