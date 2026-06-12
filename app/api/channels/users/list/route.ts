import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await getClerkClientForTenant();
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
    console.log(error)
    return NextResponse.json({ error: "Impossible de lister les personnels" }, { status: 500 });  
  }
}