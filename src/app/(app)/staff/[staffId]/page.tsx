'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { PageChrome } from '@/components/shell/page-chrome';
import { AttendanceSection } from '@/components/staff/attendance-section';
import { SalarySection } from '@/components/staff/salary-section';
import { StaffActions } from '@/components/staff/staff-actions';
import { Avatar } from '@/components/ui/avatar';
import { DetailHeader } from '@/components/ui/detail-header';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoCard } from '@/components/ui/info-card';
import { DetailSkeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { staffMemberHooks } from '@/hooks/resources';
import { money, shortDate } from '@/lib/format';

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'salary', label: 'Salary' },
];

export default function StaffDetailPage() {
  const params = useParams<{ staffId: string }>();
  const staffId = Number(params.staffId);
  const { data: staff, isPending } = staffMemberHooks.useItem(staffId);
  const [tab, setTab] = useState('profile');

  if (isPending) {
    // Keep the app bar (back chevron + where you are) while the record
    // loads, then a placeholder shaped like the page that follows.
    return (
      <>
        <PageChrome title="Staff member" backHref="/staff" />
        <DetailSkeleton />
      </>
    );
  }
  if (!staff) return <EmptyState title="Staff member not found" description="They may have been removed." />;

  return (
    <div className="space-y-6">
      <PageChrome title={staff.full_name} backHref="/staff" />
      <DetailHeader
        backHref="/staff"
        backLabel="All staff"
        title={staff.full_name}
        leading={<Avatar name={staff.full_name} size="lg" />}
        status={<StatusBadge status={staff.status} />}
        meta={`${staff.designation || 'Staff'}${staff.joining_date ? ` · Joined ${shortDate(staff.joining_date)}` : ''}`}
        actions={<StaffActions staff={staff} />}
      />

      <Tabs tabs={TABS} value={tab} onValueChange={setTab} />

      {tab === 'profile' && (
        <InfoCard
          title="Employee details"
          fields={[
            { label: 'Designation', value: staff.designation || '—' },
            { label: 'Status', value: <StatusBadge status={staff.status} /> },
            { label: 'Phone', value: staff.phone || '—' },
            { label: 'CNIC', value: staff.cnic || '—' },
            { label: 'Emergency contact', value: staff.emergency_contact || '—' },
            { label: 'Joining date', value: staff.joining_date ? shortDate(staff.joining_date) : '—' },
            { label: 'Monthly salary', value: money(staff.salary) },
          ]}
        />
      )}
      {tab === 'attendance' && <AttendanceSection staffId={staffId} />}
      {tab === 'salary' && <SalarySection staffId={staffId} />}
    </div>
  );
}
