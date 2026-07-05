import { BillingDocList } from '@/components/billing/billing-doc-list';
import { billsToDocItems } from '@/components/billing/to-doc-items';
import { InfoCard } from '@/components/ui/info-card';
import { VehicleList } from '@/components/vehicles/vehicle-list';
import type { useFlatDetail } from '@/hooks/use-flat-detail';
import { AccountSummary } from './account-summary';
import { FlatOwnerCard } from './flat-owner-card';
import { FlatResidentCard } from './flat-resident-card';

type FlatDetail = ReturnType<typeof useFlatDetail>;

/** Overview tab: two-column body (info + people/vehicles | summary + bills). */
export function FlatOverview({ detail }: { detail: FlatDetail }) {
  const { flat, building, owner, resident, residentIsOwner, activeOccupantId, vehicles, bills, charges, outstanding } = detail;
  if (!flat) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-6">
        <InfoCard
          title="Property details"
          fields={[
            { label: 'Building', value: building?.name ?? '—' },
            { label: 'Flat number', value: flat.flat_number },
            { label: 'Floor', value: flat.floor_number },
            { label: 'Type', value: <span className="capitalize">{flat.flat_type}</span> },
          ]}
        />
        <FlatOwnerCard flatId={flat.id} owner={owner} />
        <FlatResidentCard
          flatId={flat.id}
          resident={resident}
          residentIsOwner={residentIsOwner}
          activeOccupantId={activeOccupantId}
        />
        <VehicleList vehicles={vehicles} />
      </div>

      <div className="space-y-6">
        <AccountSummary outstanding={outstanding} billCount={bills.length} chargeCount={charges.length} />
        <BillingDocList title="Recent bills" items={billsToDocItems(bills).slice(0, 5)} emptyLabel="No bills yet" />
      </div>
    </div>
  );
}
