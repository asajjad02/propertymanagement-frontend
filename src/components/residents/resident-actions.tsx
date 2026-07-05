'use client';

import { Pencil, Phone } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import type { Person } from '@/types/api';

import { PersonFormDialog } from './person-form-dialog';

/** Detail-header actions for a resident: Call (if phone) + Edit (write roles). */
export function ResidentActions({ person }: { person: Person }) {
  const { hasRole } = useAuth();
  const [editing, setEditing] = useState(false);

  return (
    <>
      {person.phone && (
        <Button variant="secondary" size="sm" asChild>
          <a href={`tel:${person.phone}`}>
            <Phone className="h-4 w-4" />
            Call
          </a>
        </Button>
      )}
      {hasRole('admin', 'manager') && (
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
      <PersonFormDialog person={person} open={editing} onOpenChange={setEditing} />
    </>
  );
}
