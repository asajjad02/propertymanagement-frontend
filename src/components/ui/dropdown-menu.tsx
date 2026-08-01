'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';

import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
}

/** Simple action menu built on Radix DropdownMenu. */
export function DropdownMenu({ trigger, items, align = 'end' }: DropdownMenuProps) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align={align}
          sideOffset={4}
          collisionPadding={12}
          className="z-50 min-w-[11rem] rounded-control border border-hairline bg-surface p-1 shadow-pop"
        >
          {items.map((item, i) => (
            <Dropdown.Item
              key={i}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                // Row actions are among the smallest targets in the product —
                // give them a full touch row on mobile, compact on desktop.
                'flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2.5 text-base outline-none',
                'data-[highlighted]:bg-raised data-[disabled]:opacity-50 data-[disabled]:cursor-default',
                'md:py-1.5 md:text-sm',
                item.danger ? 'text-danger' : 'text-ink',
              )}
            >
              {item.icon}
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
