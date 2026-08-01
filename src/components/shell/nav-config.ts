import {
  BarChart3,
  Building2,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings2,
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
  /**
   * Shorter label for the mobile tab bar, where a tab is ~64px wide at 320px.
   * "Monthly Bills" measurably clips there; "Bills" doesn't. Falls back to
   * `label` when unset.
   */
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item; undefined = every role. */
  roles?: Role[];
  /** Not built yet — shown with a placeholder page. */
  soon?: boolean;
  /**
   * Rank for the mobile bottom bar (lower = more prominent). The bar shows the
   * highest-ranked items the current role can actually see, so a role missing
   * Overview simply promotes whatever comes next rather than showing a gap.
   * Items without a rank are reachable only through the More sheet.
   */
  mobilePriority?: number;
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
/**
 * The Operations group (Maintenance, Staff, Expenses, Complaints, Reports) is
 * hidden for now — not needed yet. The routes still exist; this just removes
 * them from the sidebar. Re-add OPERATIONS_GROUP to `navGroups` to restore.
 */
const OPERATIONS_GROUP: NavGroupDef = {
  label: 'Operations',
  items: [
    { label: 'Maintenance', href: '/maintenance', icon: Wrench, roles: WRITE_MGMT, soon: true },
    { label: 'Staff', href: '/staff', icon: UserCog, roles: ['admin', 'manager'] },
    { label: 'Expenses', href: '/expenses', icon: Receipt, roles: WRITE_MGMT, soon: true },
    { label: 'Complaints', href: '/complaints', icon: MessageSquare, roles: ['admin', 'manager'] },
    { label: 'Reports', href: '/reports', icon: BarChart3, roles: WRITE_MGMT, soon: true },
  ],
};
void OPERATIONS_GROUP;

export const navGroups: NavGroupDef[] = [
  {
    label: 'Management',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'], mobilePriority: 1 },
      { label: 'Flats', href: '/flats', icon: Building2, roles: WRITE_MGMT, mobilePriority: 2 },
      { label: 'Residents', href: '/residents', icon: Users, roles: WRITE_MGMT, mobilePriority: 3 },
      { label: 'Owners', href: '/owners', icon: KeyRound, roles: WRITE_MGMT, mobilePriority: 6 },
      { label: 'Visitors', href: '/visitors', icon: UserCheck, mobilePriority: 5 },
      { label: 'Monthly Bills', shortLabel: 'Bills', href: '/billing', icon: ReceiptText, roles: WRITE_MGMT, mobilePriority: 4 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team', href: '/team', icon: UserPlus, roles: ['admin'], mobilePriority: 7 },
      { label: 'Configuration', shortLabel: 'Config', href: '/configuration', icon: Settings2, roles: ['admin'], mobilePriority: 8 },
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

/** Total tabs in the mobile bottom bar, including "More" when one is needed. */
export const MOBILE_NAV_SLOTS = 5;

/**
 * Split this role's navigation into bottom-bar tabs and More-sheet overflow.
 *
 * The More slot is always reserved, even for a role whose destinations would
 * all fit: the sheet is also the only mobile home for the account controls
 * (theme, settings, sign out) that live in the desktop sidebar footer.
 */
export function mobileNavForRole(role: Role | null): { bar: NavItemDef[]; overflow: NavItemDef[] } {
  const items = navGroupsForRole(role)
    .flatMap((group) => group.items)
    .sort((a, b) => (a.mobilePriority ?? Infinity) - (b.mobilePriority ?? Infinity));

  return { bar: items.slice(0, MOBILE_NAV_SLOTS - 1), overflow: items.slice(MOBILE_NAV_SLOTS - 1) };
}
