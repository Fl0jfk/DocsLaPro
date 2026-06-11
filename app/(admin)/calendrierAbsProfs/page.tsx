import { redirect } from "next/navigation";

export default function CalendrierAbsProfsRedirectPage() {
  redirect("/absences?tab=calendrier");
}
