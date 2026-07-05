import { cn } from '@/lib/cn';

import type { NavGroupDef } from './nav-config';
import { NavItem } from './nav-item';

export function NavGroup({ group, collapsed }: { group: NavGroupDef; collapsed: boolean }) {
  return (
    <div>
      <p className={cn('label-mono px-3 pb-1.5', collapsed && 'sr-only')}>{group.label}</p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}
