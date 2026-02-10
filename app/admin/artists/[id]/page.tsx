export default async function AdminArtist({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="p-6">Artist {id}</main>; }
