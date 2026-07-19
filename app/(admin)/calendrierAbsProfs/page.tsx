import { redirect } from "next/navigation";

export default function CalendrierAbsProfsPage() {
  redirect("/rh?tab=absences&view=calendrier");
}
