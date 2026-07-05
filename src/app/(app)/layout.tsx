import { RouteGuard } from '@/components/auth/route-guard';
import { AppShell } from '@/components/shell/app-shell';

/** Layout for every authenticated page: auth guard + app chrome. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
