'use client';

import { useMemo } from 'react';

import { Select } from '@/components/ui/select';
import { staffMemberHooks } from '@/hooks/resources';

/** Sentinel value for "no staff member" (Radix Select can't use an empty value). */
export const UNASSIGNED = 'none';

/** Select bound to the account's staff members. Value is the staff id as a string. */
export function StaffSelect({
  value,
  onValueChange,
  id,
  placeholder = 'Select staff',
  includeUnassigned = false,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  includeUnassigned?: boolean;
}) {
  const staff = staffMemberHooks.useAll();
  const options = useMemo(() => {
    const members = (staff.data ?? []).map((s) => ({
      value: String(s.id),
      label: s.designation ? `${s.full_name} · ${s.designation}` : s.full_name,
    }));
    return includeUnassigned ? [{ value: UNASSIGNED, label: 'Unassigned' }, ...members] : members;
  }, [staff.data, includeUnassigned]);

  return (
    <Select id={id} value={value} onValueChange={onValueChange} options={options} placeholder={placeholder} className="w-full" />
  );
}
