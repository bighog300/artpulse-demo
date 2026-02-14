export function scopedReadBatchIds(inputIds: string[], ownedIds: string[]) {
  const owned = new Set(ownedIds);
  return inputIds.filter((id) => owned.has(id));
}
