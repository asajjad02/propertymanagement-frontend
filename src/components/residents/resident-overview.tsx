import { BillingDocList } from '@/components/billing/billing-doc-list';
import { billsToDocItems, chargesToDocItems } from '@/components/billing/to-doc-items';
import { InfoCard } from '@/components/ui/info-card';
import { VehicleList } from '@/components/vehicles/vehicle-list';
import type { useResidentDetail } from '@/hooks/use-resident-detail';

type ResidentDetail = ReturnType<typeof useResidentDetail>;

/** Overview tab: personal info + ledger (main) · emergency contact + vehicles (aside). */
export function ResidentOverview({ detail }: { detail: ResidentDetail }) {
  const { person, flat, vehicles, bills, charges } = detail;
  if (!person) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-6">
        <InfoCard
          title="Personal information"
          fields={[
            { label: 'CNIC', value: person.cnic || '—' },
            { label: 'Phone', value: person.phone || '—' },
            { label: 'Email', value: person.email || '—' },
            { label: 'Flat', value: flat?.flat_number ?? '—' },
            { label: 'Permanent address', value: person.permanent_address || '—', full: true },
          ]}
        />
        <BillingDocList title="Ledger — bills" items={billsToDocItems(bills).slice(0, 5)} emptyLabel="No bills" />
      </div>

      <div className="space-y-6">
        <InfoCard
          title="Emergency contact"
          fields={[
            { label: 'Name', value: person.emergency_contact_name || '—' },
            { label: 'Number', value: person.emergency_contact_number || '—' },
          ]}
        />
        <VehicleList vehicles={vehicles} />
        <BillingDocList title="Maintenance" items={chargesToDocItems(charges).slice(0, 5)} emptyLabel="No charges" />
      </div>
    </div>
  );
}
