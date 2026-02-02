import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 500,
    });
    const users = response.data.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.emailAddresses[0].emailAddress,
      avatar: user.imageUrl
    }));
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Impossible de lister les personnels" }, { status: 500 });
  }
}