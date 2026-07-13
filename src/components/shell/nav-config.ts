import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  SlidersHorizontal,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Wrench,
  ReceiptText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Role } from '@/types/api';

export interface NavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item; undefined = every role. */
  roles?: Role[];
  /** Not built yet — shown with a placeholder page. */
  soon?: boolean;
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

const WRITE_MGMT: Role[] = ['admin', 'manager', 'accountant'];

/**
 * Sidebar navigation. Items flagged `soon` route to a "coming soon" placeholder
 * so the section exists in the shell while its module is built later.
 */
export const navGroups: NavGroupDef[] = [
  {
    label: 'Management',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
      { label: 'Flats', href: '/flats', icon: Building2, roles: WRITE_MGMT },
      { label: 'Residents', href: '/residents', icon: Users, roles: WRITE_MGMT },
      { label: 'Visitors', href: '/visitors', icon: UserCheck },
      { label: 'Monthly Bills', href: '/billing', icon: ReceiptText, roles: WRITE_MGMT },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Maintenance', href: '/maintenance', icon: Wrench, roles: WRITE_MGMT, soon: true },
      { label: 'Staff', href: '/staff', icon: UserCog, roles: ['admin', 'manager'] },
      { label: 'Expenses', href: '/expenses', icon: Receipt, roles: WRITE_MGMT, soon: true },
      { label: 'Complaints', href: '/complaints', icon: MessageSquare, roles: ['admin', 'manager'] },
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: WRITE_MGMT, soon: true },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team', href: '/team', icon: UserPlus, roles: ['admin'] },
      { label: 'Rates', href: '/rates', icon: SlidersHorizontal, roles: ['admin'] },
    ],
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
