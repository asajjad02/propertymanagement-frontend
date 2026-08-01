'use client';

import { Hammer } from 'lucide-react';

import { PageChrome } from '@/components/shell/page-chrome';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

/** Placeholder for sidebar sections whose module isn't built yet. */
export function ComingSoon({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-6">
      {/* Covers the expenses / maintenance / reports placeholders in one go. */}
      <PageChrome title={title} />
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-card border border-dashed border-hairline bg-surface">
        <EmptyState
          icon={Hammer}
          title="Coming soon"
          description="This module is planned. The backend and screens will be wired up next."
        />
      </div>
    </div>
  );
}
