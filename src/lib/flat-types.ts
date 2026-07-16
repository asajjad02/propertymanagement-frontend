/**
 * The flat types the app offers. The backend stores `flat_type` as a free
 * CharField, so any string is technically accepted — but these are the values
 * the UI creates and filters on, kept in one place so the add/edit form, the
 * bulk-add dialog, and the list filter never drift apart.
 */
export interface FlatTypeOption {
  value: string;
  label: string;
}

export const FLAT_TYPE_OPTIONS: FlatTypeOption[] = [
  { value: 'studio', label: 'Studio' },
  { value: '1-bed', label: '1-Bed' },
  { value: '2-bed', label: '2-Bed' },
  { value: '3-bed', label: '3-Bed' },
  { value: 'penthouse', label: 'Penthouse' },
];

/** Default selected when creating a flat. */
export const DEFAULT_FLAT_TYPE = '2-bed';
