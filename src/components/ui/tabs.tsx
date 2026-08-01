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
      {/* Four-plus tabs don't fit a phone at desktop spacing, and wrapping them
          breaks the underline rail — scroll the strip instead. */}
      <RadixTabs.List
        className={cn(
          'flex gap-5 overflow-x-auto scrollbar-none border-b border-hairline',
          'md:gap-6 md:overflow-visible',
          className,
        )}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative -mb-px shrink-0 whitespace-nowrap py-3 text-sm text-muted transition-colors',
              'touch-manipulation hover:text-ink',
              'data-[state=active]:text-ink data-[state=active]:font-medium',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'focus-visible:outline-none md:py-2.5',
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
