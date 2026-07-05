'use client';

import * as RadixTabs from '@radix-ui/react-tabs';

import { cn } from '@/lib/cn';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** Controlled underline tabs. Render panels separately, keyed off `value`. */
export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List className={cn('flex gap-6 border-b border-hairline', className)}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative -mb-px py-2.5 text-sm text-muted transition-colors hover:text-ink',
              'data-[state=active]:text-ink data-[state=active]:font-medium',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'focus-visible:outline-none',
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
