import { redirect } from "next/navigation";

export default async function PersonnelIdLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/rh/${id}`);
}
