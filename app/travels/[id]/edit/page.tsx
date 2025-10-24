import VoyageEditForm from "./form";

export default function VoyageEditPage({ params }: { params: { id: string } }) {
  return <VoyageEditForm voyageId={params.id} />;
}