'use client';

import { Pencil, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import type { Flat } from '@/types/api';

import { FlatFormDialog } from './flat-form-dialog';

/** Detail-header actions for a flat: Edit (write roles) + Generate bill link. */
export function FlatActions({ flat }: { flat: Flat }) {
  const { hasRole } = useAuth();
  const [editing, setEditing] = useState(false);

  return (
    <>
      {hasRole('admin', 'manager', 'accountant') && (
        <Button variant="secondary" size="sm" asChild>
          <Link href="/billing">
            <Zap className="h-4 w-4" />
            Generate bill
          </Link>
        </Button>
      )}
      {hasRole('admin', 'manager') && (
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
      <FlatFormDialog flat={flat} open={editing} onOpenChange={setEditing} />
    </>
  );
}
