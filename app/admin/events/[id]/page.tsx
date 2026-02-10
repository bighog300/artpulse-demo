export default async function AdminEditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="p-6 space-y-2"><h1 className="text-2xl font-semibold">Edit Event</h1><p>ID: {id}</p></main>;
}
