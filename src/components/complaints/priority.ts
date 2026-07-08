/** Shared priority vocabulary for complaints: labels, tones, and select options. */
import type { Tone } from '@/components/ui/tones';
import type { ComplaintPriority } from '@/types/api';

/** emergency → red, urgent → amber, routine → neutral (semantic tones, never hex). */
export const PRIORITY_TONE: Record<ComplaintPriority, Tone> = {
  emergency: 'red',
  urgent: 'amber',
  routine: 'neutral',
};

export const PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  routine: 'Routine',
};

/** Options for the create/edit form (Segmented/Select). */
export const PRIORITY_OPTIONS: { value: ComplaintPriority; label: string }[] = [
  { value: 'emergency', label: 'Emergency' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'routine', label: 'Routine' },
];
