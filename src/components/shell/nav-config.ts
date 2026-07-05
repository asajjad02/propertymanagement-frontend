import { Building2, LayoutList, Palette, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Role } from '@/types/api';

export interface NavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item; undefined = every role. */
  roles?: Role[];
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

/**
 * Sidebar navigation. Only routes that exist in the app are listed. Role gating
 * mirrors who has a reason to use each area (security guards see visitors only).
 */
export const navGroups: NavGroupDef[] = [
  {
    label: 'Management',
    items: [
      { label: 'Flats', href: '/flats', icon: Building2, roles: ['admin', 'manager', 'accountant'] },
      { label: 'Residents', href: '/residents', icon: Users, roles: ['admin', 'manager', 'accountant'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Visitors', href: '/visitors', icon: LayoutList },
      { label: 'Electricity Billing', href: '/billing/electricity', icon: Zap, roles: ['admin', 'manager', 'accountant'] },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Style Guide', href: '/style-guide', icon: Palette }],
  },
];

/** Filter groups/items by role, dropping groups left empty. */
export function navGroupsForRole(role: Role | null): NavGroupDef[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0);
}
