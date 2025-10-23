// app/travels/[id]/edit/page.tsx
import VoyageEditForm from "./form";

// page.tsx reste côté serveur
export default function VoyageEditPage({ params }: { params: { id: string } }) {
  return <VoyageEditForm voyageId={params.id} />;
}