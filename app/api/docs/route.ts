import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type SpaceUser = {
  clerkUserId: string;
  email?: string;
  docsUrl?: string;
};

type SpaceFile = { users: SpaceUser[] };

export async function GET() {
  const { userId } = await auth();
  if (!userId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 })}
  const filePath = path.join(process.cwd(), "provisioning", "user-spaces.json");
  let data: SpaceFile;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    data = JSON.parse(raw) as SpaceFile;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return NextResponse.json({ docsUrl: null, configured: false });
    }
    return NextResponse.json({ error: "Invalid provisioning file" }, { status: 500 });
  }
  const found = data.users.find((u) => u.clerkUserId === userId);
  if (!found?.docsUrl) {
    return NextResponse.json({ docsUrl: null, configured: true });
  }
  return NextResponse.json({ docsUrl: found.docsUrl });
}
