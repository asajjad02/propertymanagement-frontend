import { BillingDocList } from '@/components/billing/billing-doc-list';
import { billsToDocItems } from '@/components/billing/to-doc-items';
import { Card, CardBody } from '@/components/ui/card';
import { InfoCard } from '@/components/ui/info-card';
import { LoadingBlock } from '@/components/ui/spinner';
import { VehicleList } from '@/components/vehicles/vehicle-list';
import type { useFlatDetail } from '@/hooks/use-flat-detail';
import { AccountSummary } from './account-summary';
import { FlatOwnerCard } from './flat-owner-card';
import { FlatResidentCard } from './flat-resident-card';

type FlatDetail = ReturnType<typeof useFlatDetail>;

/** Overview tab: two-column body (info + people/vehicles | summary + bills). */
export function FlatOverview({ detail }: { detail: FlatDetail }) {
  const { flat, owner, resident, residentIsOwner, activeOccupantId, vehicles, bills, charges, outstanding, billsLoading } = detail;
  if (!flat) return null;

  return (
    /*
     * The account summary is the aside on desktop but comes *first* on mobile:
     * "what do they owe" is the question this screen mostly gets opened to
     * answer, and as the last block in a single column it sat several screens
     * down behind property details, people and vehicles.
     */
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1.55fr_1fr]">
      {/*
       * `contents` dissolves these two wrappers on mobile so every card becomes
       * a direct grid item and can be ordered individually — the summary first,
       * recent bills last, everything else in between. Promoting the whole
       * aside instead would drag an empty "Recent bills" block to the top of
       * the screen. At `lg` the wrappers return and the two-column layout is
       * exactly as it was.
       */}
      <div className="contents *:order-2 lg:block lg:space-y-6">
        <InfoCard
          title="Property details"
          fields={[
            { label: 'Flat number', value: flat.flat_number },
            { label: 'Floor', value: flat.floor_number },
            { label: 'Type', value: flat.apartment_type_name || flat.flat_type || '—' },
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

      <div className="contents lg:block lg:space-y-6">
        {billsLoading ? (
          <Card className="order-1"><CardBody><LoadingBlock label="Loading account…" /></CardBody></Card>
        ) : (
          <>
            {/* "What do they owe" — the question this screen gets opened to answer. */}
            <AccountSummary
              className="order-1"
              outstanding={outstanding}
              billCount={bills.length}
              chargeCount={charges.length}
            />
            <BillingDocList
              className="order-3"
              title="Recent bills"
              items={billsToDocItems(bills).slice(0, 5)}
              emptyLabel="No bills yet"
            />
          </>
        )}
      </div>
    </div>
  );
}
