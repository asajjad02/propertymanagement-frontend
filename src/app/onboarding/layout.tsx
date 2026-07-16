import { RouteGuard } from '@/components/auth/route-guard';

/** Onboarding is authenticated but runs outside the app shell (no sidebar). */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
