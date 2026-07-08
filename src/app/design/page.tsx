'use client';

/**
 * Design library — a living catalog of every UI primitive in all variants and
 * both themes. This is the reference surface for the "Quiet Instrument" system
 * (docs/design/). Visit /design. Not part of the product nav; internal tooling.
 */
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  DateRangeFilter,
  type DateRange,
  DropdownMenu,
  EmptyState,
  ErrorSummary,
  Field,
  FilterBar,
  FilterChips,
  InfoCard,
  Input,
  LoadingBlock,
  Modal,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  StatCardRow,
  StatusBadge,
  Tabs,
  Textarea,
  Tooltip,
  TooltipProvider,
  TypeTag,
  useToast,
} from '@/components/ui';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import type { ColumnDef } from '@tanstack/react-table';

type DemoRow = { flat: string; owner: string; status: string; amount: number };
const DEMO_ROWS: DemoRow[] = [
  { flat: 'A-101', owner: 'Imran Qureshi', status: 'paid', amount: 7650 },
  { flat: 'A-204', owner: 'Bilal Ahmed', status: 'issued', amount: 10795 },
  { flat: 'B-311', owner: 'Ayesha Siddiqui', status: 'overdue', amount: 3015 },
];
const DEMO_COLS: ColumnDef<DemoRow, unknown>[] = [
  { id: 'flat', header: 'Flat', accessorKey: 'flat', meta: { sortable: true } },
  { id: 'owner', header: 'Owner', accessorKey: 'owner', meta: { sortable: true } },
  { id: 'status', header: 'Status', accessorKey: 'status', cell: (c) => <StatusBadge status={c.getValue() as string} /> },
  {
    id: 'amount',
    header: 'Amount',
    accessorKey: 'amount',
    meta: { align: 'right', sortable: true },
    cell: (c) => `Rs ${(c.getValue() as number).toLocaleString()}`,
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="label-mono border-b border-hairline pb-2">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function DesignGalleryPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [seg, setSeg] = useState('all');
  const [sel, setSel] = useState<string>();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState<string | null>('flat');
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<DateRange>({});
  const [demoFilters, setDemoFilters] = useState<string[]>(['building', 'type']);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-dvh bg-paper px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="label-mono text-primary-text">Hash Residency</p>
            <h1 className="display mt-2 text-[1.9rem] text-ink">Design library</h1>
            <p className="mt-1.5 max-w-prose text-sm text-muted">
              Every primitive in the “Quiet Instrument” system, in one place. Toggle the theme to
              check both. See <span className="font-mono text-xs">docs/design/</span> for the spec.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button size="icon" aria-label="Add"><Plus className="h-4 w-4" /></Button>
        </Section>

        <Section title="Status & tags">
          <StatusBadge status="paid" />
          <StatusBadge status="issued" />
          <StatusBadge status="overdue" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="vacant" />
          <TypeTag type="owner" />
          <TypeTag type="tenant" />
          <Badge tone="indigo">Custom</Badge>
        </Section>

        <Section title="Stat cards">
          <div className="w-full">
            <StatCardRow>
              <StatCard label="Total flats" value={48} />
              <StatCard label="Occupied" value={41} tone="green" sub="of 48 units" />
              <StatCard label="Dues open" value="Rs 1.84L" tone="amber" sub="12% vs last mo" />
              <StatCard label="Collected" value="92%" tone="green" />
            </StatCardRow>
          </div>
        </Section>

        <Section title="Avatars">
          <Avatar name="Imran Qureshi" />
          <Avatar name="Ayesha Siddiqui" />
          <Avatar name="Bilal Ahmed" size="lg" />
          <Avatar name="Sana Javed" size="sm" />
        </Section>

        <Section title="Form controls">
          <div className="w-full max-w-md space-y-4">
            <ErrorSummary messages={['Building is required.', 'Enter an amount greater than 0.']} />
            <Field label="Flat number">{(id) => <Input id={id} placeholder="A-101" />}</Field>
            <Field label="Building">{(id) => <Select id={id} value={sel} onValueChange={setSel} options={[{ value: 'a', label: 'Block A' }, { value: 'b', label: 'Block B' }]} placeholder="Select building…" />}</Field>
            <Field label="Notes" hint="Optional">{(id) => <Textarea id={id} placeholder="Anything worth noting…" />}</Field>
            <Field label="Amount" error="Enter an amount greater than 0.">{(id) => <Input id={id} defaultValue="0" />}</Field>
            <Segmented options={[{ value: 'all', label: 'All' }, { value: 'occupied', label: 'Occupied' }, { value: 'vacant', label: 'Vacant' }]} value={seg} onValueChange={setSeg} />
          </div>
        </Section>

        <Section title="Filter bar + tabs">
          <div className="w-full space-y-4">
            <FilterBar
              left={<Segmented options={[{ value: 'all', label: 'All' }, { value: 'occupied', label: 'Occupied' }]} value={seg} onValueChange={setSeg} />}
              right={<SearchInput value={search} onChange={setSearch} placeholder="Search…" />}
            />
            <Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'billing', label: 'Billing' }, { value: 'documents', label: 'Documents' }]} value={tab} onValueChange={setTab} />
          </div>
        </Section>

        <Section title="Filters (list controls)">
          <div className="w-full space-y-3">
            <FilterBar
              left={<Segmented options={[{ value: 'all', label: 'All' }, { value: 'occupied', label: 'Occupied' }, { value: 'vacant', label: 'Vacant' }]} value={seg} onValueChange={setSeg} />}
              right={
                <>
                  <Select value={sel} onValueChange={setSel} options={[{ value: 'a', label: 'Block A' }, { value: 'b', label: 'Block B' }]} placeholder="Building" />
                  <DateRangeFilter value={range} onChange={setRange} />
                  <SearchInput value={search} onChange={setSearch} placeholder="Search…" />
                </>
              }
            />
            <FilterChips
              chips={demoFilters.map((f) => ({
                id: f,
                label: f === 'building' ? 'Building: Block A' : 'Type: 2-Bed',
                onRemove: () => setDemoFilters((list) => list.filter((x) => x !== f)),
              }))}
              onClearAll={() => setDemoFilters([])}
            />
          </div>
        </Section>

        <Section title="Data table — sortable, paginated">
          <div className="w-full">
            <Card>
              <DataTable
                columns={DEMO_COLS}
                data={DEMO_ROWS}
                ordering={ordering}
                onOrderingChange={setOrdering}
                ariaLabel="Demo bills"
              />
              <Pagination page={page} pageSize={20} total={137} onPageChange={setPage} />
            </Card>
          </div>
        </Section>

        <Section title="Cards & info">
          <Card className="w-72">
            <CardHeader><CardTitle>Card title</CardTitle></CardHeader>
            <CardBody className="text-sm text-ink-secondary">Flat, hairline-bordered surface — the workhorse container.</CardBody>
          </Card>
          <InfoCard
            title="Property details"
            className="w-80"
            fields={[
              { label: 'Building', value: 'Block A' },
              { label: 'Flat number', value: 'A-101' },
              { label: 'Floor', value: '1' },
              { label: 'Type', value: '2-Bed' },
            ]}
          />
        </Section>

        <Section title="Overlays & feedback">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Confirm dialog</Button>
          <DropdownMenu
            trigger={<Button variant="secondary">Row actions ▾</Button>}
            items={[
              { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: () => toast.info('Edit clicked') },
              { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setConfirmOpen(true) },
            ]}
          />
          <Tooltip content="I'm a tooltip"><Button variant="ghost">Hover me</Button></Tooltip>
          <Button variant="secondary" onClick={() => toast.success('Payment recorded', 'Rs 7,650 for A-101.')}>Toast: success</Button>
          <Button variant="secondary" onClick={() => toast.warning('Reading overdue', 'Enter this month’s meter reading.')}>Toast: warning</Button>
          <Button variant="secondary" onClick={() => toast.error('Could not save', 'Check the highlighted fields.')}>Toast: error</Button>
        </Section>

        <Section title="Empty & loading states">
          <Card className="w-full max-w-md">
            <EmptyState icon={Building2} title="No flats yet" description="Add the first flat to get started." action={<Button size="sm"><Plus className="h-4 w-4" />Add flat</Button>} />
          </Card>
          <Card className="w-full max-w-md"><LoadingBlock /></Card>
        </Section>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Add flat" description="Create a new unit in a building." footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => { setModalOpen(false); toast.success('Flat added'); }}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Flat number">{(id) => <Input id={id} placeholder="A-101" />}</Field>
          <Field label="Floor">{(id) => <Input id={id} placeholder="1" />}</Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete flat A-101?"
        description="This can’t be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { setConfirmOpen(false); toast.success('Flat deleted'); }}
      />
    </div>
    </TooltipProvider>
  );
}
