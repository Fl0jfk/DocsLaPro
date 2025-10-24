import VoyageEditForm from "./form";

interface VoyageEditPageProps { params: { id: string}}

export default function VoyageEditPage({ params }: VoyageEditPageProps) {
  return <VoyageEditForm voyageId={params.id} />;
}
