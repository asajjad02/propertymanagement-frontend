'use client';

import { useMemo } from 'react';

import { Select } from '@/components/ui/select';
import { usePeopleLookup } from '@/hooks/use-lookups';

/** Select bound to the account's people, by full name. Value is the person id as a string. */
export function PersonSelect({
  value,
  onValueChange,
  id,
  placeholder = 'Select a person',
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const people = usePeopleLookup();
  const options = useMemo(
    () => (people.data ?? []).map((p) => ({ value: String(p.id), label: p.full_name })),
    [people.data],
  );

  return (
    <Select id={id} value={value} onValueChange={onValueChange} options={options} placeholder={placeholder} className="w-full" />
  );
}
