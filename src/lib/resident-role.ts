/**
 * A resident's role, derived from their ownership + occupancy records:
 * - `owner-resident` — owns the flat they actively live in (owner-occupied)
 * - `owner`          — owns a flat but doesn't live in it (rented out / absentee)
 * - `tenant`         — rents; actively occupies a flat they don't own
 * - `null`           — a person on file with no ownership or active occupancy yet
 */
export type ResidentRole = 'owner-resident' | 'owner' | 'tenant';

export function deriveResidentRole(
  personId: number,
  opts: {
    /** Whether this person has an Owner record. */
    isOwner: boolean;
    /** The flat this person actively occupies, if any. */
    occupiedFlatId: number | null;
    /** Resolve a flat id to the person id of its owner (null if unowned/unknown). */
    ownerPersonIdOfFlat: (flatId: number) => number | null;
  },
): ResidentRole | null {
  const { isOwner, occupiedFlatId, ownerPersonIdOfFlat } = opts;
  if (isOwner) {
    if (occupiedFlatId != null && ownerPersonIdOfFlat(occupiedFlatId) === personId) {
      return 'owner-resident';
    }
    return 'owner';
  }
  if (occupiedFlatId != null) return 'tenant';
  return null;
}
