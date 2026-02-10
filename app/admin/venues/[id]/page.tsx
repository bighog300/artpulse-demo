export default async function AdminVenue({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="p-6">Venue {id}</main>; }
