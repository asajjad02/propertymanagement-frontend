'use client';

import { PageChrome } from '@/components/shell/page-chrome';
import { ApartmentTypesSection } from '@/components/configuration/apartment-types-section';
import { ElectricityRateSection } from '@/components/configuration/electricity-rate-section';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/providers/auth-provider';

export default function ConfigurationPage() {
  const { hasRole } = useAuth();

  if (!hasRole('admin')) {
    return (
      <div className="space-y-6">
        <PageChrome title="Configuration" />
        <PageHeader title="Configuration" subtitle="System settings for your property." />
        <EmptyState title="Admins only" description="Configuration is restricted to administrators." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageChrome title="Configuration" />
      <PageHeader title="Configuration" subtitle="System settings for your property." />
      <ApartmentTypesSection />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ElectricityRateSection />
      </div>
    </div>
  );
}
