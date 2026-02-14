export async function assertOwnedSavedSearch(
  findOwned: (id: string, userId: string) => Promise<{ id: string } | null>,
  id: string,
  userId: string,
) {
  const existing = await findOwned(id, userId);
  return Boolean(existing);
}
