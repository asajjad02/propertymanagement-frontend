'use client';

import { useState } from 'react';

import { PageChrome } from '@/components/shell/page-chrome';
import { AccountSection } from '@/components/settings/account-section';
import { AppearanceSection } from '@/components/settings/appearance-section';
import { PasswordSection } from '@/components/settings/password-section';
import { ProfileSection } from '@/components/settings/profile-section';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [tab, setTab] = useState('profile');

  const tabs = [
    { value: 'profile', label: 'Profile' },
    { value: 'security', label: 'Security' },
    { value: 'appearance', label: 'Appearance' },
    ...(isAdmin ? [{ value: 'account', label: 'Account' }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageChrome title="Settings" />
      <PageHeader title="Settings" subtitle="Your profile, security, appearance, and account." />
      <Tabs tabs={tabs} value={tab} onValueChange={setTab} />
      <div className="max-w-3xl">
        {tab === 'profile' && <ProfileSection />}
        {tab === 'security' && <PasswordSection />}
        {tab === 'appearance' && <AppearanceSection />}
        {tab === 'account' && isAdmin && <AccountSection />}
      </div>
    </div>
  );
}
