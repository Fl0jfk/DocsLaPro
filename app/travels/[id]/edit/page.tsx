import VoyageEditForm from "./form";

export default async function VoyageEditPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <VoyageEditForm voyageId={id} />;
}
